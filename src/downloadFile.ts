import { Args } from "./parseArgs";
import { URL } from "url";
import fs from "fs";
import fsPromises from "fs/promises";
import http from "http";
import https from "https";

export default function downloadFile(
    filePath: string,
    url: string,
    args: Args,
    resolve: (value: any) => void,
    reject: (error: string | Error) => void
) {
    let protocol: typeof http | typeof https = null;

    console.log(`queued for downloading:`);
    console.log(`    ${url}`);

    switch (true) {
        case url.slice(0, 7) == "http://":
            protocol = http;
            break;
        case url.slice(0, 8) == "https://":
            protocol = https;
            break;
        case url.slice(0, 8) == "file:///":
            url = url.slice(8);
            (async function () {
                if (args.noLinks) {
                    await fsPromises.copyFile(url, filePath);
                } else {
                    await fsPromises.symlink(url, filePath);
                }
                console.log(`picked local file:`);
                console.log(`    ${url}`);
                resolve(null);
            })();
            return;
        default:
            resolve(null);
            return;
    }

    protocol
        .get(url, { timeout: args.timeout }, function (response) {
            switch (response.statusCode) {
                case 200:
                    let file = fs.createWriteStream(filePath, {
                        autoClose: true,
                    });
                    response.pipe(file);

                    file.on("finish", () => {
                        console.log(`downloaded:`);
                        console.log(`    ${filePath}`);
                        resolve(null);
                    });

                    file.on("error", () => {
                        fs.unlinkSync(filePath);
                        console.log(`failed:`);
                        console.log(`    ${url}`);
                        console.log(file.errored.message);
                        resolve(null);
                    });
                    return;
                case 301:
                case 302:
                    console.log(`file moved:`);
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
                            console.log(`    ${url}`);
                            console.log(`    error: ${err.message}`);
                            resolve(null);
                            return;
                        }
                    }
                    downloadFile(filePath, newUrl.href, args, resolve, reject);
                    return;
                default:
                    console.log(`failed:`);
                    console.log(`    ${url}`);
                    console.log(`    Response status: ${response.statusCode}`);
                    resolve(null);
                    return;
            }
        })
        .on("error", (err) => {
            console.log(`failed:`);
            console.log(`    ${url}`);
            console.log(err.message);
            resolve(null);
        });
}
