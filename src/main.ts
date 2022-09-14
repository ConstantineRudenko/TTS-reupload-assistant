import extractUrls from "./extractUrls";
import fsPromises from "fs/promises";
import fs from "fs";
import parseArgs from "./parseArgs";
import path from "path";
import urlToFname from "./urlToFname";

import downloadFile from "./downloadFile";
import enumerateCachedFiles from "./enumerateCachedFiles";

declare global {
    interface String {
        replaceAll(searchValue: string | RegExp, replaceValue: string): string;
    }
}

(async function () {
    const args = parseArgs();

    let saveFileContent = fs.readFileSync(args.saveFilePath, "utf-8");
    const urls = extractUrls(saveFileContent);

    const cachedFiles = enumerateCachedFiles(args.cacheFolder);

    const promises = urls.map(function (url) {
        return new Promise(async function (resolve, reject) {
            const fname = urlToFname(url);
            const filePath = path.join(args.tmpPath, fname);

            const exists = await new Promise((resolve) =>
                fsPromises
                    .access(filePath, fs.constants.F_OK)
                    .then(() => {
                        resolve(true);
                    })
                    .catch(() => {
                        resolve(false);
                    })
            );

            if (exists) {
                resolve(null);
                return;
            }

            const cachedInstances = cachedFiles.filter(
                (cachedFile) => cachedFile.fname == fname
            );

            if (cachedInstances.length > 1) {
                throw new Error("duplicate cache entires");
            }

            if (cachedInstances.length == 1) {
                if (args.noLinks) {
                    await fsPromises.copyFile(
                        cachedInstances[0].fullPath,
                        filePath
                    );
                } else {
                    await fsPromises.symlink(
                        cachedInstances[0].fullPath,
                        filePath
                    );
                }

                resolve(null);
                //console.log(`picked cached instance:`);
                //console.log(`    ${url}`);
                return;
            }

            downloadFile(filePath, url, resolve, reject);
        });
    });

    await Promise.all(promises);

    urls.forEach(function (url) {
        const fname = urlToFname(url);
        const filePath = path.join(args.tmpPath, fname);
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

    console.log("finished");
})();
