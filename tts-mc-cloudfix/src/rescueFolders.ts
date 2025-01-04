import { Args } from './parseArgs.ts';
import { getCloudInfo, writeCloudInfo } from './shared.ts';

export function rescueFolders(args: Args) {
	const cloudInfo = getCloudInfo(args);

	const cloudFolders = Array.from(
		new Set(
			Object.values(cloudInfo.cloudFiles).flatMap((file) =>
				file.Folder.split('\\').map((_, id, arr) =>
					arr.slice(0, id + 1).join('\\')
				)
			)
		)
	);

	console.log(JSON.stringify(cloudFolders, null, 2));

	writeCloudInfo({ cloudFolders }, args);
}
