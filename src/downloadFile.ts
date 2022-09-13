import { URL } from "url";
import fs from "fs";
import http from "http";
import https from "https";

export default function downloadFile(
    filePath: string,
    url: string,
    resolve: (value: any) => void,
    reject: (error: string | Error) => void
) {
    if (fs.existsSync(filePath)) {
        resolve(null);
        return;
    }

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

    protocol.get(url, function (response) {
        switch (response.statusCode) {
            case 200:
                let file = fs.createWriteStream(filePath, { autoClose: true });
                response.pipe(file);

                file.on("finish", () => {
                    console.log(`downloaded:`);
                    console.log(`    ${filePath}`);
                    resolve(null);
                });

                file.on("error", () => {
                    fs.unlinkSync(filePath);
                    reject(`Error: ${file.errored.message}`);
                });
                return;
            case 301:
            case 302:
                console.log(`[warning] file moved:`);
                console.log(`    old: ${url}`);
                console.log(`    new: ${response.headers["location"]}`);

                let newUrl: URL;
                try {
                    newUrl = new URL(response.headers["location"]);
                } catch {
                    const oldUrl = new URL(url);
                    newUrl = new URL(
                        `${oldUrl.protocol}//${oldUrl.hostname}${response.headers["location"]}`
                    );
                    console.log(`    full: ${newUrl.href}`);
                }
                downloadFile(filePath, newUrl.href, resolve, reject);
                return;
            default:
                reject("Response status: " + response.statusCode);
                return;
        }
    });
}
