import { URL } from "url";
import fs from "fs";
import http from "http";
import https from "https";

export default function downloadFile(
    filePath: string,
    url: string,
    resolve: (value: any) => void,
    reject: (error: string | Error) => void,
    queue: string[]
) {
    let protocol: typeof http | typeof https = null;

    switch (true) {
        case url.slice(0, 7) == "http://":
            protocol = http;
            break;
        case url.slice(0, 8) == "https://":
            protocol = https;
            break;
        default:
            resolve(null);
            return;
    }

    protocol
        .get(url, function (response) {
            switch (response.statusCode) {
                case 200:
                    let file = fs.createWriteStream(filePath, {
                        autoClose: true,
                    });
                    response.pipe(file);

                    file.on("finish", () => {
                        console.log(`downloaded:`);
                        console.log(`    ${filePath}`);
                        queue.splice(
                            queue.findIndex((x) => x == url),
                            1
                        );
                        console.log(queue);
                        console.log(`num in queue: ${queue.length}`);
                        resolve(null);
                    });

                    file.on("error", () => {
                        fs.unlinkSync(filePath);
                        console.log(`failed:`);
                        console.log(`    ${url}`);
                        console.log(file.errored.message);
                        queue.splice(
                            queue.findIndex((x) => x == url),
                            1
                        );
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
                            queue.splice(
                                queue.findIndex((x) => x == url),
                                1
                            );
                            resolve(null);
                            return;
                        }
                    }
                    downloadFile(filePath, newUrl.href, resolve, reject, queue);
                    return;
                default:
                    console.log(`failed:`);
                    console.log(`    ${url}`);
                    console.log(`    Response status: ${response.statusCode}`);
                    queue.splice(
                        queue.findIndex((x) => x == url),
                        1
                    );
                    resolve(null);
                    return;
            }
        })
        .on("error", (err) => {
            console.log(`failed:`);
            console.log(`    ${url}`);
            console.log(err.message);
            queue.splice(
                queue.findIndex((x) => x == url),
                1
            );
            resolve(null);
        });
}
