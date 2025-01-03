import docopt from 'docopt';

interface ArgsRaw {
	clean: boolean;
	corrupt: boolean;
	delete: boolean;
	'rescue-folders': boolean;
	'<cloud>': string;
}

type Command = 'clean' | 'corrupt' | 'delete' | 'rescue-folders';

export interface Args {
	command: 'clean' | 'corrupt' | 'delete' | 'rescue-folders';
	cloudPath: string;
}

function getArgsRaw(): ArgsRaw {
	try {
		return docopt(
			`TTS reupload helper
Usage:
    tts-mc-cloudfix clean <cloud>
    tts-mc-cloudfix corrupt <cloud>
    tts-mc-cloudfix delete <cloud>
    tts-mc-cloudfix rescue-folders <cloud>

Arguments:
	<cloud> Folder with "CloudFolder.bson" and "CloudInfo.bson". Example: "C:/Games/Steam/userdata/123456789/286160/remote/"

Procedure:
	1. Shut down Steam.
	2. Run: "tts-mc-cloudfix clean <cloud>".
	3. Run: "tts-mc-cloudfix corrupt <cloud>".
	4. Launch Steam, start Tabletop Simulator.
	5. "Sync conflict" window should appear.
	6. Run: "tts-mc-cloudfix delete <cloud>".
	7. Click "Upload to the Steam Cloud" in "Sync conflict" window.
	8. Done.


Commands:
	clean
		When you delete a folder in your Steam cloud from Cloud Manager in
		Tabletop Simulator, it does not bother to delete files from inside that
		folder. These files will no longer be visible in UI, but their records
		will remain.
	corrupt
		You can't just delete files from Steam cloud because it will download
		them right back. Instead, you need to bring up the "Sync conflict"
		dialog. The "corrupt" command will replace the contents of orphaned
		files with garbage, so you can bring up "Sync conflict" dialog and
		delete them for real.
	delete
		Deletes the orphaned files from Tabletop Simulator in Steam cloud.
	rescue-folders
		Normally, this option should never be needed. Other tools may
		accidentally erase records of your Steam cloud folders in Tabletop
		Simulator. When it happens, it will look as if all files are in the
		root folder. The file records contain the folder where this file is
		to be placed, but Tabletop Simulator will ignore it if the
		corresponding folder does not exist. The "rescue-folders" option will
		find missing folder records based on your file records and re-create
		them.
`
		) as unknown as ArgsRaw;
	} catch (err: any) {
		console.log(err.message);
		Deno.exit();
	}
}

function pickCommand(argsRaw: ArgsRaw): Command {
	switch (true) {
		case argsRaw.clean:
			return 'clean';
		case argsRaw.corrupt:
			return 'corrupt';
		case argsRaw.delete:
			return 'delete';
		case argsRaw['rescue-folders']:
			return 'rescue-folders';
		default:
			throw new RangeError(`Unrecognized command.`);
	}
}

export default function parseArgs(): Args {
	const opts = getArgsRaw();
	return { command: pickCommand(opts), cloudPath: opts['<cloud>'] };
}
