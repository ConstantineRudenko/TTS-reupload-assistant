import * as Log from './logger';
import { Args } from './parseArgs';
import fs from 'fs';
import fsPromises from 'fs/promises';
import http from 'http';
import https from 'https';
import { URL } from 'url';

export default async function downloadFile(
    filePath: string,
    url: string,
    urlIndex: number,
    args: Args
) {
    let protocol: typeof http | typeof https | undefined = undefined;

    Log.withUrl(url, urlIndex, 'started downloading');

    switch (true) {
        case url.slice(0, 7) == 'http://':
            protocol = http;
            break;
        case url.slice(0, 8) == 'https://':
            protocol = https;
            break;
        case url.slice(0, 8) == 'file:///':
            if (args.noLinks) {
                await fsPromises.copyFile(url.slice(8), filePath);
            } else {
                await fsPromises.symlink(url.slice(8), filePath);
            }

            Log.withUrl(url, urlIndex, 'picked local file');

            return;
        default:
            return;
    }

    await new Promise((resolve) => {
        protocol!
            .get(
                url,
                // https://github.com/nodejs/node/issues/39341
                {
                    timeout: args.timeout,
                    //headers: { Connection: "keep-alive" },
                },
                (response) => {
                    void (async () => {
                        await urlResponse(
                            response,
                            url,
                            urlIndex,
                            args,
                            filePath
                        );
                        resolve(null);
                    })();
                }
            )
            .on('error', (err) => {
                Log.withUrl(url, urlIndex, `download error: ${err.message}`);
                resolve(null);
            });
    });
}

async function urlResponse(
    response: http.IncomingMessage,
    url: string,
    urlIndex: number,
    args: Args,
    filePath: string
) {
    switch (response.statusCode) {
        case 200: {
            const file = fs.createWriteStream(filePath, {
                autoClose: true,
            });
            response.pipe(file);

            await new Promise((resolve) => {
                file.on('finish', () => {
                    Log.withUrl(url, urlIndex, 'downloaded successfully');
                    resolve(null);
                });

                file.on('error', (err) => {
                    Log.withUrl(url, urlIndex, `file error: ${err.message}`);
                    resolve(null);
                    try {
                        fs.unlink(filePath, () => {
                            // do nothing
                        });
                    } catch {
                        // do nothing
                    }
                    throw err;
                });
            });

            return;
        }
        case 301:
        case 302: {
            Log.withUrl(url, urlIndex, 'file moved');
            Log.spaced(`old:\n${url}`);

            let newUrl: URL;
            try {
                newUrl = new URL(response.headers['location'] ?? 'error');
                Log.spaced(`new:\n${response.headers['location']}`);
            } catch {
                try {
                    const oldUrl = new URL(url);
                    Log.spaced(`new (local):\n${response.headers['location']}`);
                    newUrl = new URL(url, oldUrl.host);
                    Log.spaced(`new:\n${newUrl.href}`);
                } catch (err) {
                    Log.spaced(`error: ${(err as Error).message}`);
                    return;
                }
            }
            await downloadFile(filePath, newUrl.href, urlIndex, args);
            return;
        }
        default:
            Log.withUrl(url, urlIndex, 'failed download');
            Log.spaced(`response code: ${response.statusCode}`);
            return;
    }
}
