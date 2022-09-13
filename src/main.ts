import extractUrls from "./extractUrls";
import fs from "fs";
import parseArgs from "./parseArgs";
import path from "path";
import urlToFname from "./urlToFname";

import downloadFile from "./downloadFile";

declare global {
    interface String {
        replaceAll(searchValue: string | RegExp, replaceValue: string): string;
    }
}

(async function () {
    const args = parseArgs();

    let saveFileContent = fs.readFileSync(args.saveFilePath, "utf-8");
    const urls = extractUrls(saveFileContent);

    const promises = urls.map(function (url) {
        return new Promise(function (resolve, reject) {
            const fname = urlToFname(url);
            const filePath = path.join(args.tmpPath, fname);
            downloadFile(filePath, url, resolve, reject);
        });
    });

    await Promise.all(promises);

    urls.forEach(function (url) {
        const filePath = path.join(args.tmpPath, urlToFname(url));
        if (fs.existsSync(filePath) == false) {
            return;
        }

        saveFileContent = saveFileContent.replaceAll(
            url,
            `file:///${path.join(args.tmpPath, urlToFname(url))}`.replaceAll(
                "\\",
                "/"
            )
        );
    });

    fs.writeFileSync(`${args.saveFilePath}.edited`, saveFileContent);

    console.log("finished!");
})();
