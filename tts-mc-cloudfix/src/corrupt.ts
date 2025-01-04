import { getOrphanFiles } from './shared.ts';

import * as path from 'path';

export async function corruptOrphanFiles(pathCloud: string) {
	const orphanFiles = getOrphanFiles(pathCloud);
	console.log(`orphan files: ${orphanFiles.length}`);
	await Promise.all(
		orphanFiles.map((file) =>
			(async () => {
				const orphanPath = path.join(pathCloud, file);
				await Deno.writeTextFile(
					orphanPath,
					"I shouldn't have to do this"
				);
			})()
		)
	);
	await Deno.remove(
		path.normalize(path.join(pathCloud, '../remotecache.vdf'))
	);
}
