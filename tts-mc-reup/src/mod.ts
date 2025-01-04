import * as Cache from './enumerateCachedFiles.ts';
import downloadFile, { DownloadResut } from './downloadFile.ts';
import extractUrls from './extractUrls.ts';
import parseArgs from './parseArgs.ts';
import * as path from 'path';
import { runDownloadTasks, UrlDownloadTask } from './runDownloadQueue.ts';
import { exists, existsSync } from 'fs';
import { DownloadSchedule } from './downloadSchedule.ts';
import { replaceBulk } from './replaceMultiple.ts';
import { getLogger as log, Logger } from 'log/get-logger';
import logSetup from './logSetup.ts';

logSetup();
const { args, rawArgs } = parseArgs();
log().debug('Launched with arguments', { args, rawArgs });

if (!args.resume && Array.from(Deno.readDirSync(args.tmpPath)).length > 0) {
	log().critical(
		'The <temp-folder> is not empty. Either provide an empty <temp-folder> or use --resume. Do not use --resume if the save file was changed since the last launch. Re-downloading everything is safer.'
	);
	Deno.exit();
}

const saveFileContent = Deno.readTextFileSync(args.saveFilePath);
const urls = extractUrls(saveFileContent);
log().info(`URLs detected.`, { numUrls: urls.length });
log().debug(`URLs`, { urls: urls });

const cachedFiles = Cache.enumerateCachedFiles(args.cacheFolder);

const downloadTasks: UrlDownloadTask[] = urls.map(function (
	url,
	urlId
): UrlDownloadTask {
	log().debug('URL queued for processing.', { url, urlId });

	return {
		url: url,
		urlId,
		attempts: 0,
		schedule: new DownloadSchedule(),
		func: async function (): Promise<DownloadResut> {
			const filePath = path.join(args.tmpPath, String(urlId));

			if (await exists(filePath)) {
				return {
					ok: true,
					status: 'existed',
					statusText: 'Target file already exists.',
					retryAfterTime: 0,
				};
			}

			const cachedInstance = Cache.getCachedInstance(cachedFiles, url);

			if (cachedInstance != null) {
				log().debug('Found cached file.', {
					url,
					urlId,
					cacheFile: cachedInstance.fullPath,
				});

				if (args.links) {
					await Deno.symlink(cachedInstance.fullPath, filePath);
				} else {
					await Deno.copyFile(cachedInstance.fullPath, filePath);
				}

				return {
					ok: true,
					status: 0,
					statusText: '',
					retryAfterTime: 0,
				};
			}

			return await downloadFile(filePath, url, urlId, args);
		},
	};
});

log().info('Initating the download queue...');

await runDownloadTasks(downloadTasks, args);

log().info('End of the download queue.');
log().info('Editing save file...');

const replacements: [string, string][] = urls.flatMap((url, urlId) => {
	const filePath = path.join(args.tmpPath, String(urlId));
	if (!existsSync(filePath)) {
		return [];
	}
	return [[`"${url}"`, `"file:///${filePath}"`.replaceAll('\\', '/')]];
});
const replacementDict = Object.fromEntries(replacements);

const saveFileContentNew = replaceBulk(saveFileContent, replacementDict);

log().info('Finished editing save file.');
log().info('Writing new save file...');

const savePath = path.join(
	path.dirname(args.saveFilePath),
	`${path.basename(args.saveFilePath, '.json')}.reupload.json`
);

Deno.writeTextFileSync(savePath, saveFileContentNew);

log().info('Finished writing new save file.');
