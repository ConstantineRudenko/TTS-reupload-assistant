import docopt from 'docopt';

interface ArgsRaw {
	'<tts-save-file>': string;
	'<tts-cache-folder>': string;
	'<temp-folder>': string;

	'--timeout': string;
	'--simultaneous': string;
	'--max-attempts': string;

	'--links': boolean;
	'--resume': boolean;
}

export interface Args {
	saveFilePath: string;
	cacheFolder: string;
	tmpPath: string;

	timeout: number;
	simultaneous: number;
	maxAttempts: number;

	resume: boolean;
	links: boolean;
}

function getArgsRaw(): ArgsRaw {
	try {
		return docopt(
			`TTS Reupload Helper
Usage:
    tts-mc-reup <tts-save-file> <tts-cache-folder> <temp-folder> [options]

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
    --resume
        By default the <temp-folder> is expected to be empty, and an error
        will be raised otherwise. With this flag, files that already exist
        in <temp-folder> will not be re-downloaded. This allows to resume
        after a crash. If the wrong <temp-folder> is provided or the save file
        has changed since the last attempt, resuming will corrupt the newly
        created save file by linking wrong files from <temp-folder>.
    --links
        Make soft links instead of copying local files.
    --max-attempts=N [default:5]
        How many times to retry a failed download before giving up.
    --simultaneous=N [default: 5]
        How many files should be downloaded simultaneously.
    --timeout=T  [default: 10000]
        How long to wait in milliseconds for the server response
        before giving up on a URL.

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

export default function parseArgs(): { args: Args; rawArgs: ArgsRaw } {
	const raw = getArgsRaw();

	return {
		rawArgs: raw,
		args: {
			saveFilePath: raw['<tts-save-file>'],
			tmpPath: raw['<temp-folder>'],
			cacheFolder: raw['<tts-cache-folder>'],
			links: raw['--links'],
			resume: raw['--resume'],
			timeout: parseTimeout(raw['--timeout'] ?? 0),
			maxAttempts: parseRetries(raw['--max-attempts'] ?? 5),
			simultaneous: parseSimultaneous(raw['--simultaneous'] ?? '5'),
		},
	};
}

function parseRetries(retriesStr: string) {
	const maxAttempts = Number(retriesStr);
	if (isNaN(maxAttempts) || maxAttempts < 0) {
		console.log(`Invalid number of maxAttempts: ${maxAttempts}`);
		Deno.exit();
	}
	return maxAttempts;
}

function parseSimultaneous(sSimultaneous: string): number {
	const simultaneous = Number(sSimultaneous);
	if (isNaN(simultaneous) || simultaneous <= 0) {
		console.log(
			`Invalid number of simultaneous downloads: ${sSimultaneous}`
		);
		Deno.exit();
	}
	return simultaneous;
}

function parseTimeout(sTimeout: string): number {
	const timeout = Number(sTimeout);
	if (isNaN(timeout) || timeout <= 0) {
		console.log('Invalid timeout provided');
		Deno.exit();
	}
	return timeout;
}
