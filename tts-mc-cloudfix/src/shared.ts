import { loadBsonSync, saveBsonSync } from './bson.ts';
import {Args} from './parseArgs.ts'

import * as path from 'path';
import * as fs from 'fs';

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
export type CloudFolders = Record<string, string>;

export interface CloudInfo {
	cloudFiles: CloudFiles,
	cloudFolders: string[]
};

function getBsonPaths(args: Args){
	const pathCloudInfo = path.join(args.pathCloud, cloudFileNames.CloudInfo);
	const pathCloudFolder = path.join(args.pathCloud, cloudFileNames.CloudFolder);
	return {pathCloudFolder, pathCloudInfo};
}

function getCloudFiles(args: Args) {
	const {pathCloudInfo} = getBsonPaths(args);
	return loadBsonSync<CloudFiles>(pathCloudInfo);
}

function getCloudFolders(args: Args) {
	const {pathCloudFolder} = getBsonPaths(args);
	return Object.values(loadBsonSync<CloudFolders>(pathCloudFolder));
}

function writeCloudFiles(cloudFiles: CloudFiles, args: Args){
	const {pathCloudInfo} = getBsonPaths(args)
	saveBsonSync(cloudFiles, pathCloudInfo);
}

function writeCloudFolders(cloudFolders: string[], args: Args){
	const {pathCloudFolder} = getBsonPaths(args);
	const obj:CloudFolders = Object.fromEntries(cloudFolders.toSorted().map((value, id) => [id, value]));
	saveBsonSync(obj, pathCloudFolder)
}

function getBackupPath(fname: string, args: Args){
	const dateString = new Date().toISOString().replaceAll(':', "-");
	const newFname = `${dateString}_${fname}`;
	return path.join(args.pathBackup, newFname)
}

function backupFile(path: string, fname: string, args:Args){
	const backupPath = getBackupPath(fname, args);
	if(!fs.existsSync(path)){
		return;
	}
	if (fs.existsSync(backupPath)){
		throw new Error(`File already exists: ${backupPath}`);
	}
	Deno.copyFileSync(path, backupPath);
}

export function writeCloudInfo(cloudInfo: Partial<CloudInfo>, args: Args) {
	const bsonPaths = getBsonPaths(args);

	backupFile(bsonPaths.pathCloudFolder, cloudFileNames.CloudFolder, args);
	backupFile(bsonPaths.pathCloudInfo, cloudFileNames.CloudInfo, args);

	if (cloudInfo.cloudFiles != undefined){
		writeCloudFiles(cloudInfo.cloudFiles, args);
	}
	if (cloudInfo.cloudFolders != undefined){
		writeCloudFolders(cloudInfo.cloudFolders, args);
	}
}

export function getCloudInfo(args: Args) {
	return {
		cloudFiles: getCloudFiles(args),
		cloudFolders: getCloudFolders(args),
	};
}

function getActiveFiles(args: Args): string[] {
	const { cloudFiles } = getCloudInfo(args);
	return Object.entries(cloudFiles).map(([fname, _]) => fname);
}

export function getOrphanFiles(args:Args) {
	const existingFiles = Array.from(Deno.readDirSync(args.pathCloud))
		.filter(
			(dirEntry) =>
				dirEntry.isFile && !cloudFileNamesArr.includes(dirEntry.name)
		)
		.map((dirEntry) => dirEntry.name);
	const filesActive = getActiveFiles(args);
	return existingFiles.filter((fname) => !filesActive.includes(fname));
}