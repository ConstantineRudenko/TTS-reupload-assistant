import './lib/extendBuildin';
import * as Cache from './enumerateCachedFiles';
import downloadFile from './downloadFile';
import extractUrls from './extractUrls';
import fs from 'fs';
import fsPromises from 'fs/promises';
import parseArgs from './parseArgs';
import path from 'path';
import { printUrl } from './printUrl';
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
        console.log('queued for processing:');
        printUrl(urlIndex, url);

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
                    console.log('file exists:');
                    printUrl(urlIndex, url);
                    return;
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

                    console.log('picked cached file:');
                    printUrl(urlIndex, url);
                    return;
                }

                await downloadFile(filePath, url, urlIndex, args);
            },
        };
    });

    console.log('initating the download queue...');

    await runDownloadTasks(downloadTasks, args);

    console.log('end of the download queue');
    console.log('editing save file...');

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

    console.log('finished editing save file');
    console.log('writing new save file...');

    fs.writeFileSync(`${args.saveFilePath}.edited`, saveFileContent);

    console.log('finished writing new save file');
})();
