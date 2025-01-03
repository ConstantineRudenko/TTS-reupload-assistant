import { loadBson } from './loadBson.ts';
import * as path from 'jsr:@std/path';

const cloudFileNames = {
	CloudInfo: 'CloudInfo.bson',
	CloudFolder: 'CloudFolder.bson',
};
const cloudFileNamesValues = Object.values(cloudFileNames)
export { cloudFileNamesValues as "cloudFileNames"};

export type CloudInfo = Record<
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



function getCloudFiles(pathCloud: string) {
	const pathCloudInfo = path.join(pathCloud, cloudFileNames.CloudInfo);
	return loadBson<CloudInfo>(pathCloudInfo);
}

function getCloudFolders(pathCloud: string) {
	const pathCloudFolder = path.join(pathCloud, cloudFileNames.CloudFolder);
	return Object.values(loadBson<CloudFolder>(pathCloudFolder));
}

export function getCloudInfo(pathCloud: string) {
	return {
		cloudFiles: getCloudFiles(pathCloud),
		cloudFolders: getCloudFolders(pathCloud),
	};
}
