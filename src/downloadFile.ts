import * as Log from './logger';
import { Args } from './parseArgs';
import fsPromises from 'fs/promises';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { pipeline } from 'stream/promises';

async function downloadRemoteFile(
	filePath: string,
	url: string,
	urlIndex: number,
	args: Args
) {
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
	let protocol: typeof http | typeof https | undefined = undefined;

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
				await downloadRemoteFile(filePath, url, urlIndex, args);

				Log.withUrl(url, urlIndex, 'downloaded file');
			} catch (err) {
				Log.withUrl(url, urlIndex, `download error: ${err.message}`);
			}
			return;
	}
}

function handleRedirect(oldUrlStr: string, response: http.IncomingMessage) {
	const responseLocation = response.headers['location'];
	if (!responseLocation) {
		throw new Error('empty redirect url');
	}
	const newUrlStr = responseLocation;

	try {
		const newUrl = new URL(newUrlStr);
		Log.spaced(`new:\n${newUrlStr}`);
		return newUrl;
	} finally {
	}

	const oldUrl = new URL(oldUrlStr);
	Log.spaced(`new (relative):\n${newUrlStr}`);
	const newUrl = new URL(newUrlStr, oldUrl.host);
	Log.spaced(`new:\n${newUrl.href}`);

	return newUrl;
}
