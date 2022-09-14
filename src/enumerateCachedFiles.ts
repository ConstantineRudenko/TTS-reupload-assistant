import fs from "fs";
import path from "path";

export default function enumerateCachedFiles(dir: string) {
    const cachedFiles: { cachedFname: string; fullPath: string }[] = [];

    fs.readdirSync(dir)
        .filter((child) => {
            if (!fs.lstatSync(path.join(dir, child)).isDirectory()) {
                return false;
            }
            if (child.slice(-3) == "Raw") {
                // these are generated by TTS from non-raw folders
                return false;
            }
            return true;
        })
        .forEach((subdir) =>
            fs.readdirSync(path.join(dir, subdir)).forEach((fname) => {
                const splitFname = fname.split(".");
                let fnameNoExt: string = null;
                if (splitFname == null) {
                    fnameNoExt = fname;
                } else {
                    fnameNoExt = "".concat(...splitFname.slice(0, -1));
                }
                cachedFiles.push({
                    cachedFname: fnameNoExt,
                    fullPath: path.join(dir, subdir, fname),
                });
            })
        );

    return cachedFiles;
}
