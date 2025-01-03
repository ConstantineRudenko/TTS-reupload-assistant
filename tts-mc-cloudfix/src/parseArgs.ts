import docopt from 'docopt';

interface ArgsRaw {
	clean: boolean;
	corrupt: boolean;
	delete: boolean;
	'rescue-folders': boolean;
	'<cloud>': string;
	'<backup>': string;
}

type Command = 'clean' | 'corrupt' | 'delete' | 'rescue-folders';

export interface Args {
	command: 'clean' | 'corrupt' | 'delete' | 'rescue-folders';
	pathCloud: string;
	pathBackup: string;
}

function getArgsRaw(): ArgsRaw {
	try {
		return docopt(
			`TTS CloudFix
Usage:
    tts-mc-cloudfix clean <cloud> <backup>
    tts-mc-cloudfix corrupt <cloud> <backup>
    tts-mc-cloudfix delete <cloud>
    tts-mc-cloudfix rescue-folders <cloud>

Arguments:
	<cloud>
		Folder with "CloudFolder.bson" and "CloudInfo.bson".
		Example: "C:/Games/Steam/userdata/123456789/286160/remote/"
	<backup>
		Backup folder. The original files will be copied here before the tool
		alters them.

Procedure:
	1. Run: "tts-mc-cloudfix clean <cloud>".
	2. Open Tabletop Simulator. 
	   Open the Cloud Manager.
	   Check if everything still looks OK.
	3. Shut down Steam.
	3. Run: "tts-mc-cloudfix corrupt <cloud>".
	4. Launch Steam, start Tabletop Simulator.
	   "Sync conflict" window should appear.
	6. Run: "tts-mc-cloudfix delete <cloud>".
	7. Choose "Local Save" in "Sync conflict" window and click "Continue".
	8. Done.


Commands:
	delete
		Deletes the orphaned files from Tabletop Simulator in Steam cloud.
	clean
		When you delete a folder in your Steam cloud from Cloud Manager in
		Tabletop Simulator, it does not bother to delete files from inside that
		folder. These files will no longer be visible in UI, but their records
		will remain. The "clean" command will purge the records of the orphaned
		files, but it will not delete them from your Steam cloud.

		This might have been fixed in Tabletop Simulator at some point, making
		the "clean" command unnecessary. The fix prevents new orphaned records,
		but at the time of writing it did not remove pre-existing ones from
		before the fixed was rolled out.
	corrupt
		You can't just delete files from Steam cloud because it will download
		them right back. Instead, you need to bring up the "Sync conflict"
		dialog. The "corrupt" command will replace the contents of orphaned
		files with garbage, so you can bring up "Sync conflict" dialog and
		delete them for real.
	rescue-folders
		Normally, this option should never be needed. Recreates the file
		"CloudFolder.bson" in your Steam Cloud from the redundant data inside
		"CloudInfo.bson". Empty folders will be lost.

		This command can be useful if "CloudFolder.bson" somehow got corrupted.
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
	return {
		command: pickCommand(opts),
		pathCloud: opts['<cloud>'],
		pathBackup: opts['<backup>'],
	};
}
