import * as bson from 'npm:bson';
import * as path from 'jsr:@std/path';

const FNames = {
	CloudInfo: 'CloudInfo.bson',
	CloudFolder: 'CloudFolder.bson',
};
const allFNames = Object.values(FNames);

function loadBson<T>(pathBson: string) {
	const data = Deno.readFileSync(pathBson);
	return bson.deserialize(data) as T;
}

type CloudInfo = Record<
	string,
	{
		Name: string;
		URL: string;
		Size: number;
		Date: string;
		Folder: string;
	}
>;

type CloudFolder = Record<string, string>;

function getCloudFiles(pathCloud: string) {
	const pathCloudInfo = path.join(pathCloud, FNames.CloudInfo);
	return loadBson<CloudInfo>(pathCloudInfo);
}

function getCloudFolders(pathCloud: string) {
	const pathCloudFolder = path.join(pathCloud, FNames.CloudFolder);
	return Object.values(loadBson<CloudFolder>(pathCloudFolder));
}

function getCloudInfo(pathCloud: string) {
	return {
		cloudFiles: getCloudFiles(pathCloud),
		cloudFolders: getCloudFolders(pathCloud),
	};
}

function getGhostRecordKeys(pathCloud: string): string[] {
	const { cloudFiles, cloudFolders } = getCloudInfo(pathCloud);
	return Object.entries(cloudFiles)
		.filter(
			([_, fileInfo]) =>
				!(
					fileInfo.Folder == '' ||
					cloudFolders.includes(fileInfo.Folder)
				)
		)
		.map(([fname, _]) => fname);
}

function getCleanedCloudFiles(pathCloud: string): CloudInfo {
	const { cloudFiles } = getCloudInfo(pathCloud);
	const ghostRecordKeys = getGhostRecordKeys(pathCloud);
	return Object.fromEntries(
		Object.entries(cloudFiles).filter(
			([fname, _]) => !ghostRecordKeys.includes(fname)
		)
	);
}

function getActiveFiles(pathCloud: string): string[] {
	const { cloudFiles } = getCloudInfo(pathCloud);
	return Object.entries(cloudFiles).map(([fname, _]) => fname);
}

function getOrphanFiles(pathCloud: string) {
	const existingFiles = Array.from(Deno.readDirSync(pathCloud))
		.filter(
			(dirEntry) => dirEntry.isFile && !allFNames.includes(dirEntry.name)
		)
		.map((dirEntry) => dirEntry.name);
	const filesActive = getActiveFiles(pathCloud);
	return existingFiles.filter((fname) => !filesActive.includes(fname));
}

// delete remotecache.vdf, steam offline
async function corruptOrphanFiles(pathCloud: string) {
	const orphanFiles = getOrphanFiles(pathCloud);
	await Promise.all(
		orphanFiles.map((file) =>
			(async () => {
				const orphanPath = path.join(pathCloud, file);
				await Deno.writeTextFile(orphanPath, 'w');
			})()
		)
	);
	await Deno.remove(
		path.normalize(path.join(pathCloud, '../remotecache.vdf'))
	);
}

// during conflict dialog
async function removeOrphanFiles(pathCloud: string) {
	const orphanFiles = getOrphanFiles(pathCloud);
	await Promise.all(
		orphanFiles.map((file) =>
			(async () => {
				const orphanPath = path.join(pathCloud, file);
				await Deno.remove(orphanPath);
			})()
		)
	);
}

/**
 *
 * @param pathCloud Folder with "CloudFolder.bson" and "CloudInfo.bson". Example: "E:/Games/Steam/userdata/391694214/286160/remote/".
 */
export default async function fixCloudFolders(pathCloud: string) {
	const pathCloudFolder = path.join(pathCloud, 'CloudFolder.bson');
	const pathCloudInfo = path.join(pathCloud, 'CloudInfo.bson');

	const cloudInfo = loadBson<CloudInfo>(pathCloudInfo);

	const filesActive = Object.values(cloudInfo).map(
		(entry) => entry.URL.split('/').at(-2) + '_' + entry.Name
	);
	const filesExisting = Array.from(Deno.readDirSync(pathCloud))
		.filter(
			(entry) =>
				entry.isFile &&
				['CloudInfo.bson', 'CloudFolder.bson'].includes(entry.name) ==
					false
		)
		.map((entry) => entry.name);
	const fileOrphans = filesExisting.filter(
		(fileExisting) => filesActive.includes(fileExisting) == false
	);
	await Promise.allSettled(
		fileOrphans.map((orphan) =>
			(async () =>
				await Deno.rename(
					path.join(pathCloud, orphan),
					path.join('E:/cloudTrash', orphan)
				))()
		)
	);
	console.log(fileOrphans);
}

console.log(getActiveFiles('E:/Games/Steam/userdata/391694214/286160/remote/'));
// await removeOrphanFiles('E:/Games/Steam/userdata/391694214/286160/remote/');
