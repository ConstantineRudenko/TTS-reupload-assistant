import docopt from 'docopt';
import process from 'node:process';

interface ArgsRaw {
	'<tts-save-file>': string;
	'<tts-cache-folder>': string;
	'<temp-folder>': string;

	'--timeout': string;
	'--simultaneous': string;
	'--max-attempts': string;

	'--no-links': string;
}

export interface Args {
	saveFilePath: string;
	cacheFolder: string;
	tmpPath: string;

	timeout: number;
	simultaneous: number;
	maxAttempts: number;

	noLinks: boolean;
}

function getArgsRaw(): ArgsRaw {
	try {
		return docopt(
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
    --timeout=T  [default: 10000]
        How long to wait in milliseconds for the server response
        before giving up on a URL.
	--max-attempts=N [default:5]
		How many times to retry a failed download before giving up.
    --simultaneous=N [default: 5]
        How many files should be downloaded simultaneously.

Output:
    Will be placed next to the original file with ".reupload"
    added to the name.
`
		) as unknown as ArgsRaw;
	} catch (err: unknown) {
		const error = err as Partial<Error>;
		console.log(error.message);
		Deno.exit();
	}
}

export default function parseArgs(): Args {
	const opts = getArgsRaw();

	return {
		saveFilePath: opts['<tts-save-file>'],
		tmpPath: opts['<temp-folder>'],
		cacheFolder: opts['<tts-cache-folder>'],
		noLinks: Boolean(opts['--no-links']),
		timeout: parseTimeout(opts['--timeout'] ?? 0),
		maxAttempts: parseRetries(opts['--max-attempts'] ?? 5),
		simultaneous: parseSimultaneous(opts['--simultaneous'] ?? '5'),
	};
}

function parseRetries(retriesStr: string) {
	const maxAttempts = Number(retriesStr);
	if (isNaN(maxAttempts) || maxAttempts < 0) {
		console.log(`Invalid number of maxAttempts: ${maxAttempts}`);
		process.exit();
	}
	return maxAttempts;
}

function parseSimultaneous(sSimultaneous: string): number {
	const simultaneous = Number(sSimultaneous);
	if (isNaN(simultaneous) || simultaneous <= 0) {
		console.log(
			`Invalid number of simultaneous downloads: ${sSimultaneous}`
		);
		process.exit();
	}
	return simultaneous;
}

function parseTimeout(sTimeout: string): number {
	const timeout = Number(sTimeout);
	if (isNaN(timeout) || timeout <= 0) {
		console.log('Invalid timeout provided');
		process.exit();
	}
	return timeout;
}
