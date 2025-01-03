import parseArgs from './parseArgs.ts';
import { cleanOrphanFileRecords } from './clean.ts';
import { rescueFolders } from './rescueFolders.ts';
import { deleteOrphanFiles } from './delete.ts';
import { corruptOrphanFiles } from './corrupt.ts';

const args = parseArgs();

switch (args.command) {
	case 'clean':
		cleanOrphanFileRecords(args.cloudPath);
		break;
	case 'corrupt':
		corruptOrphanFiles(args.cloudPath);
		break;
	case 'delete':
		deleteOrphanFiles(args.cloudPath);
		break;
	case 'rescue-folders':
		rescueFolders(args.cloudPath);
		break;
	default:
		throw new Error('Unrecognized command.');
}
