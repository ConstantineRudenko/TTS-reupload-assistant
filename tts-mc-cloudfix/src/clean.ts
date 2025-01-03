import { getCloudInfo, CloudInfo } from './getCloudInfo.ts';

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
