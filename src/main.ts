import './lib/extendBuiltin';
import * as Cache from './enumerateCachedFiles';
import * as Log from './logger';
import downloadFile from './downloadFile';
import extractUrls from './extractUrls';
import fs from 'fs';
import fsPromises from 'fs/promises';
import parseArgs from './parseArgs';
import path from 'path';
import { runDownloadTasks, UrlDownloadTask } from './runDownloadQueue';

process.on('uncaughtException', function (err) {
    console.log(`Caught exception: ${err.message}`);
});

void (async function () {
    const args = parseArgs();

    let saveFileContent = fs.readFileSync(args.saveFilePath, 'utf-8');
    const urls = extractUrls(saveFileContent);

    const cachedFiles = Cache.enumerateCachedFiles(args.cacheFolder);

    const downloadTasks: UrlDownloadTask[] = urls.map(function (
        url,
        urlIndex
    ): UrlDownloadTask {
        Log.withUrl(url, urlIndex, 'queued for processing');

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
                    Log.withUrl(url, urlIndex, 'file exists');
                }

                const cachedInstance = Cache.getCachedInstance(
                    cachedFiles,
                    url
                );

                if (cachedInstance != null) {
                    if (args.noLinks) {
                        await fsPromises.copyFile(
                            cachedInstance.fullPath,
                            filePath
                        );
                    } else {
                        await fsPromises.symlink(
                            cachedInstance.fullPath,
                            filePath
                        );
                    }

                    Log.withUrl(url, urlIndex, 'picked cache file');
                    return;
                }

                await downloadFile(filePath, url, urlIndex, args);
            },
        };
    });

    Log.spaced('initating the download queue...');

    await runDownloadTasks(downloadTasks, args);

    Log.normal('end of the download queue');
    Log.normal('editing save file...');

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

    Log.normal('finished editing save file');
    Log.normal('writing new save file...');

    fs.writeFileSync(`${args.saveFilePath}.edited`, saveFileContent);

    Log.normal('finished writing new save file');
})();
