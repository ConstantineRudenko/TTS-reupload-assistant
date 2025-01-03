import parseArgs from './parseArgs.ts';
import { cleanOrphanFileRecords } from './clean.ts';
import { rescueFolders } from './rescueFolders.ts';
import { deleteOrphanFiles } from './delete.ts';
import { corruptOrphanFiles } from './corrupt.ts';

const args = parseArgs();

switch (args.command) {
	case 'clean':
		cleanOrphanFileRecords(args.pathCloud);
		break;
	case 'corrupt':
		corruptOrphanFiles(args.pathCloud);
		break;
	case 'delete':
		deleteOrphanFiles(args.pathCloud);
		break;
	case 'rescue-folders':
		rescueFolders(args.pathCloud);
		break;
	default:
		throw new Error('Unrecognized command.');
}
