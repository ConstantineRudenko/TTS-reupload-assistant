import * as Cache from './enumerateCachedFiles.ts';
import * as Log from './logger.ts';
import downloadFile, { DownloadResut } from './downloadFile.ts';
import extractUrls from './extractUrls.ts';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import parseArgs from './parseArgs.ts';
import path from 'node:path';
import { runDownloadTasks, UrlDownloadTask } from './runDownloadQueue.ts';
import { exists } from 'https://deno.land/std@0.224.0/fs/mod.ts';
import { DownloadSchedule } from './downloadSchedule.ts';

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
		attempts: 0,
		schedule: new DownloadSchedule(),
		func: async function (): Promise<DownloadResut> {
			const filePath = path.join(args.tmpPath, String(urlIndex));

			if (await exists(filePath)) {
				//
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

				return {
					ok: true,
					status: 0,
					statusText: '',
					retryAfterTime: 0,
				};
			}

			return await downloadFile(filePath, url, urlIndex, args);
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
