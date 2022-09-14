import { docopt } from "docopt";
import process from "process";

export default function parseArgs(): {
    saveFilePath: string;
    tmpPath: string;
    cacheFolder: string;
    noLinks: boolean;
} {
    let opts = docopt(
        `TTS reupload helper
Usage:
	reup.js <tts-save-file> <tts-cache-folder>  <temp-folder> [--no-links]

<tts-save-file>
	TTS save file to be processed

	example:	Documents/My Games/Tabletop Simulator/
				Saves/TS_Save_96.json

<tts-cache-folder>
	TTS local mod cache

	example:	Documents/My Games/Tabletop Simulator/
				Mods/
				
<temp-folder>

	Any folder to hold the downloaded files.

--no-links
	By default soft links are created for existing cached files.
	Use this option to force copying instead.

Output

	Will be placed next to the original file with ".edited" in the end.`
    );

    return {
        saveFilePath: opts["<tts-save-file>"],
        tmpPath: opts["<temp-folder>"],
        cacheFolder: opts["<tts-cache-folder>"],
        noLinks: opts["--no-links"],
    };
}
