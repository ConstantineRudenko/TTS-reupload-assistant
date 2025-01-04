import { Args } from './parseArgs.ts';
import { getCloudInfo, CloudFiles, writeCloudInfo } from './shared.ts';

function getGhostRecordKeys(args: Args): string[] {
	const { cloudFiles, cloudFolders } = getCloudInfo(args);
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

function getCleanedCloudFiles(args: Args): CloudFiles {
	const { cloudFiles } = getCloudInfo(args);
	const ghostRecordKeys = getGhostRecordKeys(args);
	console.log(`orphan file records: ${ghostRecordKeys.length}`);
	return Object.fromEntries(
		Object.entries(cloudFiles).filter(
			([fname, _]) => !ghostRecordKeys.includes(fname)
		)
	);
}

export function cleanOrphanFileRecords(args: Args) {
	writeCloudInfo({ cloudFiles: getCleanedCloudFiles(args) }, args);
}
