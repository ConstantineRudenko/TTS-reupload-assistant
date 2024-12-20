import * as Log from './logger.ts';
import { Args } from './parseArgs.ts';
import fsPromises from 'node:fs/promises';

async function downloadRemoteFile(filePath: string, url: string, args: Args) {
	const abort = new AbortController();
	setTimeout(() => {
		abort.abort();
	}, args.timeout);
	const response = await fetch(url, { signal: abort.signal });
	if (!response.ok) {
		return;
	}
	const text = await response.text();
	await fsPromises.writeFile(filePath, text, 'utf-8');
}

export default async function downloadFile(
	filePath: string,
	url: string,
	urlIndex: number,
	args: Args
) {
	Log.withUrl(url, urlIndex, 'started downloading');

	switch (true) {
		case url.slice(0, 8) == 'file:///':
			if (args.noLinks) {
				await fsPromises.copyFile(url.slice(8), filePath);
			} else {
				await fsPromises.symlink(url.slice(8), filePath);
			}

			Log.withUrl(url, urlIndex, 'picked local file');

			return;
		default:
			try {
				await downloadRemoteFile(filePath, url, args);

				Log.withUrl(url, urlIndex, 'downloaded file');
			} catch (err: any) {
				Log.withUrl(url, urlIndex, `download error: ${err.message}`);
			}
			return;
	}
}
