import { docopt } from "docopt";

export default function parseArgs(): {
    saveFilePath: string;
    tmpPath: string;
} {
    let opts = docopt(
        `TTS reupload helper
Usage:
	reup.js <tts-save-file>  <temp-folder>

<tts-save-file>
	TTS save file to be processed

	example:	Documents/My Games/Tabletop Simulator/
				Saves/TS_Save_96.json
				
<temp-folder>

	Any folder to hold the downloaded files.

Output

	Will be placed next to the original file with ".edited" in the end.`
    );

    return {
        saveFilePath: opts["<tts-save-file>"],
        tmpPath: opts["<temp-folder>"],
    };
}
