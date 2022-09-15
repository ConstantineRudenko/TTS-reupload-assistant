import { Args } from "./parseArgs";
import { URL } from "url";
import fs from "fs";
import fsPromises from "fs/promises";
import http from "http";
import https from "https";
import { printUrl } from "./printUrl";

export default async function downloadFile(
    filePath: string,
    url: string,
    urlIndex: number,
    args: Args
) {
    let protocol: typeof http | typeof https = null;

    console.log(`started downloading:`);
    printUrl(urlIndex, url);

    switch (true) {
        case url.slice(0, 7) == "http://":
            protocol = http;
            break;
        case url.slice(0, 8) == "https://":
            protocol = https;
            break;
        case url.slice(0, 8) == "file:///":
            if (args.noLinks) {
                await fsPromises.copyFile(url.slice(8), filePath);
            } else {
                await fsPromises.symlink(url.slice(8), filePath);
            }

            console.log(`picked local file:`);
            printUrl(urlIndex, url);

            return;
        default:
            return;
    }

    await new Promise((resolve) => {
        protocol
            .get(
                url,
                // https://github.com/nodejs/node/issues/39341
                {
                    timeout: args.timeout,
                    //headers: { Connection: "keep-alive" },
                },
                (response) =>
                    urlResponse(
                        response,
                        url,
                        urlIndex,
                        args,
                        filePath,
                        resolve
                    )
            )
            .on("error", (err) => {
                console.log(`download error:`);
                console.log(`    ${err.message}`);
                resolve(null);
            });
    });
}

async function urlResponse(
    response: http.IncomingMessage,
    url: string,
    urlIndex: number,
    args: Args,
    filePath: string,
    resolve: (any) => void
) {
    switch (response.statusCode) {
        case 200:
            let file = fs.createWriteStream(filePath, {
                autoClose: true,
            });
            response.pipe(file);

            file.on("finish", () => {
                console.log(`downloaded successfully`);
                resolve(null);
            });

            file.on("error", () => {
                console.log(`file error`);
                fs.unlink(filePath, (err) => {
                    throw err;
                });
                resolve(null);
            });
            return;
        case 301:
        case 302:
            console.log(`file moved:`);
            console.log(`    [${urlIndex}]`);
            console.log(`    old: ${url}`);
            console.log(`    new: ${response.headers["location"]}`);

            let newUrl: URL;
            try {
                newUrl = new URL(response.headers["location"]);
            } catch {
                try {
                    const oldUrl = new URL(url);
                    newUrl = new URL(
                        `${oldUrl.protocol}//${oldUrl.hostname}${response.headers["location"]}`
                    );
                    console.log(`    full: ${newUrl.href}`);
                } catch (err) {
                    console.log(`failed:`);
                    console.log(`    error: ${err.message}`);
                    resolve(null);
                    return;
                }
            }
            await downloadFile(filePath, newUrl.href, urlIndex, args);
            return;
        default:
            console.log(`failed:`);
            console.log(`    Response status: ${response.statusCode}`);
            resolve(null);
            return;
    }
}
