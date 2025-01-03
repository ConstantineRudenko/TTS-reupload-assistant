import docopt from 'docopt';
import process from 'node:process';

interface ArgsRaw {
	'<cloud-path>': string;
	'<backup-path>': string;
	'<operation>': 'clean' | 'corrupt' | 'delete' | 'rescue-folders';
}

export interface Args {
	saveFilePath: string;
	cacheFolder: string;
	tmpPath: string;

	timeout: number;
	simultaneous: number;

	noLinks: boolean;
}

function getArgsRaw(): ArgsRaw {
	try {
		return docopt(
			`TTS reupload helper
Usage:
    tts-mc-cloudfix clean-records <cloud>

Arguments:
	<cloud> Folder with "CloudFolder.bson" and "CloudInfo.bson". Example: "C:/Games/Steam/userdata/123456789/286160/remote/"

Options:
    --no-links
        By default soft links are created for existing cached files.
        Use this option to force copying instead.
    --timeout=T  [default: 10000]
        How long to wait in milliseconds for the server response
        before giving up on a URL.
    --simultaneous=N [default: 5]
        How many files should be downloaded simultaneously.

Output:
    Will be placed next to the original file with ".reupload"
    added to the name.
`
		) as unknown as ArgsRaw;
	} catch (err: any) {
		console.log(err.message);
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
