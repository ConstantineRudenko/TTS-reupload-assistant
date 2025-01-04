import { getOrphanFiles } from './shared.ts';

import * as path from 'path';

export async function deleteOrphanFiles(pathCloud: string) {
	const orphanFiles = getOrphanFiles(pathCloud);
	console.log(`orphan files: ${orphanFiles.length}`);
	await Promise.all(
		orphanFiles.map((file) =>
			(async () => {
				const orphanPath = path.join(pathCloud, file);
				await Deno.remove(orphanPath);
			})()
		)
	);
}
