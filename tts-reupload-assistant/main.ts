import * as Cache from './src/enumerateCachedFiles.ts';
import * as Log from './src/logger.ts';
import downloadFile from './src/downloadFile.ts';
import extractUrls from './src/extractUrls.ts';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import parseArgs from './src/parseArgs.ts';
import path from 'node:path';
import { runDownloadTasks, UrlDownloadTask } from './src/runDownloadQueue.ts';

const args = parseArgs();

let saveFileContent = fs.readFileSync(args.saveFilePath, 'utf-8');
const urls = extractUrls(saveFileContent);
Log.spaced(false, `URLs detected: ${urls.length}`);
urls.forEach((url, id) => {
	Log.withUrl(false, url, id);
});

const cachedFiles = Cache.enumerateCachedFiles(args.cacheFolder);

const downloadTasks: UrlDownloadTask[] = urls.map(function (
	url,
	urlIndex
): UrlDownloadTask {
	Log.withUrl(false, url, urlIndex, 'queued for processing');

	return {
		url: url,
		urlIndex: urlIndex,
		started: NaN,
		func: async function () {
			const filePath = path.join(args.tmpPath, String(urlIndex));

			const exists = await new Promise(
				(resolve) =>
					void fsPromises
						.access(filePath, fs.constants.F_OK)
						.then(() => {
							resolve(true);
						})
						.catch(() => {
							resolve(false);
						})
			);

			if (exists) {
				Log.withUrl(false, url, urlIndex, 'file exists');
			}

			const cachedInstance = Cache.getCachedInstance(cachedFiles, url);

			if (cachedInstance != null) {
				if (args.noLinks) {
					await fsPromises.copyFile(
						cachedInstance.fullPath,
						filePath
					);
				} else {
					await fsPromises.symlink(cachedInstance.fullPath, filePath);
				}

				Log.withUrl(false, url, urlIndex, 'picked cache file');
				return;
			}

			await downloadFile(filePath, url, urlIndex, args);
		},
	};
});

Log.spaced(false, 'initating the download queue...');

await runDownloadTasks(downloadTasks, args);

Log.normal(true, 'end of the download queue');
Log.normal(true, 'editing save file...');

urls.forEach(function (url, urlIndex) {
	const filePath = path.join(args.tmpPath, String(urlIndex));
	if (!fs.existsSync(filePath)) {
		return;
	}

	saveFileContent = saveFileContent.replaceAll(
		`"${url}"`,
		`"file:///${filePath}"`.replaceAll('\\', '/')
	);
});

Log.normal(true, 'finished editing save file');
Log.normal(true, 'writing new save file...');

const savePath = path.join(
	path.dirname(args.saveFilePath),
	`${path.basename(args.saveFilePath, '.json')}.reupload.json`
);

fs.writeFileSync(savePath, saveFileContent);

Log.normal(true, 'finished writing new save file');
