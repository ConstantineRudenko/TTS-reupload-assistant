import { saveBsonSync } from './bson.ts';
import { getCloudInfo, CloudFiles, writeCloudInfo } from './shared.ts';

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

function getCleanedCloudFiles(pathCloud: string): CloudFiles {
	const { cloudFiles } = getCloudInfo(pathCloud);
	const ghostRecordKeys = getGhostRecordKeys(pathCloud);
	console.log(`orphan file records: ${ghostRecordKeys.length}`);
	return Object.fromEntries(
		Object.entries(cloudFiles).filter(
			([fname, _]) => !ghostRecordKeys.includes(fname)
		)
	);
}

export function cleanOrphanFileRecords(pathCloud: string) {
	writeCloudInfo({ cloudFiles: getCleanedCloudFiles(pathCloud) }, pathCloud);
}
