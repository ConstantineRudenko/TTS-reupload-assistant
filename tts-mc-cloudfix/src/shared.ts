import { loadBsonSync, saveBsonSync } from './bson.ts';

import * as path from 'path';

const cloudFileNames = {
	CloudInfo: 'CloudInfo.bson',
	CloudFolder: 'CloudFolder.bson',
};
const cloudFileNamesArr = Object.values(cloudFileNames)
export { cloudFileNamesArr as "cloudFileNames"};

export type CloudFiles = Record<
	string,
	{
		Name: string;
		URL: string;
		Size: number;
		Date: string;
		Folder: string;
	}
>;
export type CloudFolder = Record<string, string>;

export interface CloudInfo {
	cloudFiles: CloudFiles,
	cloudFolders: CloudFolder[]
};

function getCloudFiles(pathCloud: string) {
	const pathCloudInfo = path.join(pathCloud, cloudFileNames.CloudInfo);
	return loadBsonSync<CloudFiles>(pathCloudInfo);
}

function getCloudFolders(pathCloud: string) {
	const pathCloudFolder = path.join(pathCloud, cloudFileNames.CloudFolder);
	return Object.values(loadBsonSync<CloudFolder>(pathCloudFolder));
}

function writeCloudFiles(cloudFiles: CloudFiles, pathCloud: string){
	const pathCloudInfo = path.join(pathCloud, cloudFileNames.CloudInfo);
	saveBsonSync(cloudFiles, pathCloudInfo);
}

function writeCloudFolders(cloudFolders: CloudFolder[], pathCloud: string){
	const pathCloudFolder = path.join(pathCloud, cloudFileNames.CloudFolder);
	const obj = Object.fromEntries(cloudFolders.toSorted().map((value, id) => [id, value]));
	saveBsonSync(obj, pathCloudFolder)
}

export function writeCloudInfo(cloudInfo: Partial<CloudInfo>, pathCloud: string) {
	if (cloudInfo.cloudFiles != undefined){
		writeCloudFiles(cloudInfo.cloudFiles, pathCloud);
	}
	if (cloudInfo.cloudFolders != undefined){
		writeCloudFolders(cloudInfo.cloudFolders, pathCloud);
	}
}

export function getCloudInfo(pathCloud: string) {
	return {
		cloudFiles: getCloudFiles(pathCloud),
		cloudFolders: getCloudFolders(pathCloud),
	};
}

function getActiveFiles(pathCloud: string): string[] {
	const { cloudFiles } = getCloudInfo(pathCloud);
	return Object.entries(cloudFiles).map(([fname, _]) => fname);
}

export function getOrphanFiles(pathCloud: string) {
	const existingFiles = Array.from(Deno.readDirSync(pathCloud))
		.filter(
			(dirEntry) =>
				dirEntry.isFile && !cloudFileNamesArr.includes(dirEntry.name)
		)
		.map((dirEntry) => dirEntry.name);
	const filesActive = getActiveFiles(pathCloud);
	return existingFiles.filter((fname) => !filesActive.includes(fname));
}

