import { Args } from './parseArgs.ts';
import { getOrphanFiles } from './shared.ts';

import * as path from 'path';

export async function deleteOrphanFiles(args: Args) {
	const orphanFiles = getOrphanFiles(args);
	console.log(`orphan files: ${orphanFiles.length}`);
	await Promise.all(
		orphanFiles.map((file) =>
			(async () => {
				const orphanPath = path.join(args.pathCloud, file);
				await Deno.remove(orphanPath);
			})()
		)
	);
}
