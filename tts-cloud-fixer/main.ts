import * as bson from 'npm:bson';
import * as path from 'jsr:@std/path';

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
	const pathCloudInfo = path.join(pathCloud, 'CloudInfo.bson');
	return loadBson<CloudInfo>(pathCloudInfo);
}

function getCloudFolders(pathCloud: string) {
	const pathCloudFolder = path.join(pathCloud, 'CloudFolder.bson');
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

function getCleanedFileRecords(pathCloud: string) {
	const { cloudFiles } = getCloudInfo(pathCloud);
	const ghostRecordKeys = getGhostRecordKeys(pathCloud);
	return Object.fromEntries(
		Object.entries(cloudFiles).filter(([fname, _]) =>
			ghostRecordKeys.includes(fname)
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

	// const folders = new Set(
	// 	Object.entries(cloudInfo).map(([_, value]) => value.Folder)
	// );
	// const foldersWithSubfolders = new Set(
	// 	Array.from(folders).flatMap((folder) => {
	// 		const parts = folder.split('\\');
	// 		return parts.map((_, index, parts) =>
	// 			parts.slice(0, index + 1).join('\\')
	// 		);
	// 	})
	// );
	// const cloudFolder = Object.fromEntries(
	// 	Array.from(foldersWithSubfolders)
	// 		.sort()
	// 		.filter((folder) => folder != '')
	// 		.map((value, index) => [String(index), value])
	// );

	// const cloudFolderBson = bson.serialize(cloudFolder, {});
	// Deno.writeFile(pathCloudFolder, cloudFolderBson);

	// console.log(
	// 	JSON.stringify(loadBson<CloudFolder>(pathCloudFolder), null, 2)
	// );
}

console.log(
	getCleanedFileRecords('E:/Games/Steam/userdata/391694214/286160/remote/')
);
