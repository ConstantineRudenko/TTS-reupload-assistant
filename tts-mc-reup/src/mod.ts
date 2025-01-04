import * as Cache from './enumerateCachedFiles.ts';
import downloadFile, { DownloadResut } from './downloadFile.ts';
import extractUrls from './extractUrls.ts';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import parseArgs from './parseArgs.ts';
import path from 'node:path';
import { runDownloadTasks, UrlDownloadTask } from './runDownloadQueue.ts';
import { exists } from 'https://deno.land/std@0.224.0/fs/mod.ts';
import { DownloadSchedule } from './downloadSchedule.ts';
import { replaceBulk } from './replaceMultiple.ts';
import * as log from 'log';

Deno.mkdirSync('./logs');

log.setup({
	handlers: {
		console: new log.ConsoleHandler('INFO', {
			// formatter: log.formatters.jsonFormatter,
			formatter: (record) =>
				`[${record.datetime.toTimeString()}] ${record.levelName}: ${
					record.msg
				}${
					record.args.length
						? `\n${JSON.stringify(record.args, null, 2)}`
						: ''
				}\n`,
			useColors: true,
		}),
		file: new log.FileHandler('DEBUG', {
			filename: `./logs/${new Date()
				.toISOString()
				.replaceAll(':', '-')}.log`,
			formatter: (record) =>
				JSON.stringify(
					{
						time: record.datetime.toUTCString,
						level: record.level,
						levelName: record.levelName,
						message: record.msg,
						data: record.args,
					},
					null,
					2
				),
			mode: 'x',
		}),
	},
	loggers: {
		default: {
			level: 'DEBUG',
			handlers: ['console', 'file'],
		},
	},
});

const args = parseArgs();

const logger = log.getLogger('default');

const saveFileContent = fs.readFileSync(args.saveFilePath, 'utf-8');
const urls = extractUrls(saveFileContent);
logger.info(`URLs detected.`, { numUrls: urls.length });
logger.debug(`URLs`, { urls: urls });

const cachedFiles = Cache.enumerateCachedFiles(args.cacheFolder);

const downloadTasks: UrlDownloadTask[] = urls.map(function (
	url,
	urlIndex
): UrlDownloadTask {
	logger.debug('URL queued for processing.', { url, urlIndex });

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
				logger.debug('Found cached file.', {
					url,
					urlIndex,
					cacheFile: cachedInstance.fullPath,
				});

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

logger.info('Initating the download queue...');

await runDownloadTasks(downloadTasks, args);

logger.info('End of the download queue.');
logger.info('Editing save file...');

const replacements: [string, string][] = urls.flatMap((url, urlIndex) => {
	const filePath = path.join(args.tmpPath, String(urlIndex));
	if (!fs.existsSync(filePath)) {
		return [];
	}
	return [[`"${url}"`, `"file:///${filePath}"`.replaceAll('\\', '/')]];
});
const replacementDict = Object.fromEntries(replacements);

const saveFileContentNew = replaceBulk(saveFileContent, replacementDict);

logger.info('Finished editing save file.');
logger.info('Writing new save file...');

const savePath = path.join(
	path.dirname(args.saveFilePath),
	`${path.basename(args.saveFilePath, '.json')}.reupload.json`
);

fs.writeFileSync(savePath, saveFileContentNew);

logger.info('Finished writing new save file.');
