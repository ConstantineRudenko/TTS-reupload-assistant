import { loadBson } from './loadBson.ts';
import { getCloudInfo, cloudFileNames, CloudInfo } from './getCloudInfo.ts';
import * as path from 'jsr:@std/path';

function getActiveFiles(pathCloud: string): string[] {
	const { cloudFiles } = getCloudInfo(pathCloud);
	return Object.entries(cloudFiles).map(([fname, _]) => fname);
}

function getOrphanFiles(pathCloud: string) {
	const existingFiles = Array.from(Deno.readDirSync(pathCloud))
		.filter(
			(dirEntry) =>
				dirEntry.isFile && !cloudFileNames.includes(dirEntry.name)
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

export default async function fixCloudFolders(pathCloud: string) {
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
