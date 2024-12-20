import * as Log from './logger.ts';
import { Args } from './parseArgs.ts';
import fsPromises from 'node:fs/promises';

function normalizeUrl(url: string): string {
	// If the URL starts with "http" or "https", it's already complete
	if (/^https?:\/\//i.test(url)) {
		return url;
	}

	// If the URL starts with "www.", prepend "http://"
	if (/^www\./i.test(url)) {
		return `http://${url}`;
	}

	// Otherwise, assume it's a relative or incomplete URL, prepend "http://"
	return `http://${url}`;
}

async function downloadRemoteFile(filePath: string, url: string, args: Args) {
	const abort = new AbortController();
	setTimeout(() => {
		abort.abort();
	}, args.timeout);

	const normalizedUrl = normalizeUrl(url);

	const response = await fetch(normalizedUrl, { signal: abort.signal });
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
	Log.withUrl(false, url, urlIndex, 'started downloading');

	switch (true) {
		case url.slice(0, 8) == 'file:///':
			if (args.noLinks) {
				await fsPromises.copyFile(url.slice(8), filePath);
			} else {
				await fsPromises.symlink(url.slice(8), filePath);
			}

			Log.withUrl(false, url, urlIndex, 'picked local file');

			return;
		default:
			try {
				await downloadRemoteFile(filePath, url, args);

				Log.withUrl(false, url, urlIndex, 'downloaded file');
			} catch (err: any) {
				Log.withUrl(
					true,
					url,
					urlIndex,
					`download error: ${err.message}`
				);
			}
			return;
	}
}
