import fs from 'fs';
import path from 'path';
import urlToCachedFname from './urlToCachedFname';

export interface CachedFileRecord {
    cachedFname: string;
    fullPath: string;
}

/**
 * @returns A cached file record (if exists), or null.
 */
export function getCachedInstance(
    cachedFiles: CachedFileRecord[],
    url: string
): CachedFileRecord {
    const cachedInstances = cachedFiles.filter(
        (cachedFile) => cachedFile.cachedFname == urlToCachedFname(url)
    );

    if (cachedInstances.length == 2) {
        if (
            cachedInstances[0].fullPath.slice(-4).toLowerCase() == '.jpg' &&
            cachedInstances[1].fullPath.slice(-4).toLowerCase() == '.png'
        ) {
            cachedInstances.splice(1, 1);
        }
    }

    switch (true) {
        case cachedInstances.length > 1:
            throw new Error(
                `duplicate cache entires:\n    ${JSON.stringify(
                    cachedInstances,
                    null,
                    2
                )}`
            );
        case cachedInstances.length == 1:
            return cachedInstances[0];
        default:
            return null;
    }
}

export function enumerateCachedFiles(dir: string) {
    const cachedFiles: CachedFileRecord[] = [];

    fs.readdirSync(dir)
        .filter((child) => {
            if (!fs.lstatSync(path.join(dir, child)).isDirectory()) {
                return false;
            }
            if (child.slice(-3) == 'Raw') {
                // these are generated by TTS from non-raw folders
                return false;
            }
            return true;
        })
        .forEach((subdir) =>
            fs.readdirSync(path.join(dir, subdir)).forEach((fname) => {
                const splitFname = fname.split('.');
                let fnameNoExt: string = null;
                if (splitFname == null) {
                    fnameNoExt = fname;
                } else {
                    fnameNoExt = ''.concat(...splitFname.slice(0, -1));
                }
                cachedFiles.push({
                    cachedFname: fnameNoExt,
                    fullPath: path.join(dir, subdir, fname),
                });
            })
        );

    return cachedFiles;
}
