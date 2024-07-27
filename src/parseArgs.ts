import { docopt } from 'docopt';
import process from 'process';

interface ArgsRaw {
	'<tts-save-file>': string;
	'<tts-cache-folder>': string;
	'<temp-folder>': string;

	'--timeout': string;
	'--simultaneous': string;

	'--no-links': string;
}

export interface Args {
	saveFilePath: string;
	cacheFolder: string;
	tmpPath: string;

	timeout: number;
	simultaneous: number;

	noLinks: boolean;
}

export default function parseArgs(): Args {
	const opts = docopt(
		`TTS reupload helper
Usage:
    reup.js <tts-save-file> <tts-cache-folder> <temp-folder> [options]

Arguments:
    <tts-save-file>
        TTS save file to be processed.
        Example:    "Documents/My Games/Tabletop Simulator/
                      Saves/TS_Save_96.json"
    <tts-cache-folder>
        TTS local mod cache.
        Example:    "Documents/My Games/Tabletop Simulator/Mods/"
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
	) as ArgsRaw;

	return {
		saveFilePath: opts['<tts-save-file>'],
		tmpPath: opts['<temp-folder>'],
		cacheFolder: opts['<tts-cache-folder>'],
		noLinks: Boolean(opts['--no-links']),
		timeout: parseTimeout(opts['--timeout']),
		simultaneous: parseSimultaneous(opts['--simultaneous'] ?? '5'),
	};
}

function parseSimultaneous(sSimultaneous: string): number {
	const simultaneous = Number(sSimultaneous);
	switch (true) {
		case isNaN(simultaneous):
		case simultaneous <= 0:
			console.log('Invalid number of simultaneous downloads.');
			console.log(sSimultaneous);
			process.exit();
	}
	return simultaneous;
}

function parseTimeout(sTimeout: string): number {
	const timeout = Number(sTimeout);
	switch (true) {
		case isNaN(timeout):
		case timeout <= 0:
			console.log('Invalid timeout provided');
			process.exit();
	}
	return timeout;
}
