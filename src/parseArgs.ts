import { docopt } from "docopt";
import process from "process";

export interface Args {
    saveFilePath: string;
    tmpPath: string;
    cacheFolder: string;
    noLinks: boolean;
    timeout: number;
    simultaneous: number;
}

export default function parseArgs(): Args {
    let opts = docopt(
        `TTS reupload helper
Usage:
    reup.js <tts-save-file> <tts-cache-folder> <temp-folder> [options]

Arguments:
    <tts-save-file>
        TTS save file to be processed.
        Example:	"Documents/My Games/Tabletop Simulator/
                      Saves/TS_Save_96.json"
    <tts-cache-folder>
        TTS local mod cache.
        Example:	"Documents/My Games/Tabletop Simulator/Mods/"		
    <temp-folder>
        Any folder to hold the downloaded files.

Options:
    --no-links
        By default soft links are created for existing cached files.
        Use this option to force copying instead.
    --timeout=T  [default: 3000]
        How long to wait in milliseconds for the server response
        before giving up on a URL.
	--simultaneous=N [default: 5]
		How many files should be downloaded simultaneously.

Output:
    Will be placed next to the original file with ".edited"
    added to the name.`
    );

    return {
        saveFilePath: opts["<tts-save-file>"],
        tmpPath: opts["<temp-folder>"],
        cacheFolder: opts["<tts-cache-folder>"],
        noLinks: opts["--no-links"],
        timeout: parseTimeout(opts["--timeout"]),
        simultaneous: parseSimultaneous(opts["--timeout"]),
    };
}

function parseSimultaneous(sSimultaneous: string): number {
    let simultaneous = Number(sSimultaneous);
    switch (true) {
        case isNaN(simultaneous):
        case simultaneous < 0:
            console.log("Invalid number of simultaneous downloads.");
            process.exit();
    }
    return simultaneous;
}

function parseTimeout(sTimeout: string): number {
    let timeout = Number(sTimeout);
    switch (true) {
        case isNaN(timeout):
        case timeout < 0:
            console.log("Invalid timeout provided");
            process.exit();
    }
    return timeout;
}
