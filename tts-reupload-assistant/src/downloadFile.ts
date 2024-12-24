import * as Log from './logger.ts';
import { Args } from './parseArgs.ts';
import fsPromises from 'node:fs/promises';

const defaultRetryTime = 10000;

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
	try {
		const response = await fetch(normalizedUrl, { signal: abort.signal });
		if (response.ok) {
			const text = await response.text();
			await fsPromises.writeFile(filePath, text, 'utf-8');
		}
		return {
			ok: response.ok,
			status: response.status,
			statusText: response.statusText,
			retryAfter: getRetryTime(response),
		};
	} catch (err: unknown) {
		const error = err as Partial<Error>;
		if (error.name == 'AbortError') {
			return {
				ok: false,
				status: -1,
				statusText: 'Timed out without server response.',
				retryAfter: defaultRetryTime,
			};
		}
		return {
			ok: false,
			status: -2,
			statusText: 'Unknown error.',
			retryAfter: defaultRetryTime,
		};
	}
}

function getRetryTime(response: Response) {
	const headerValue = response.headers.get('Retry-After');
	if (headerValue == null) {
		return [408, 429].indexOf(response.status) == -1 ? 0 : defaultRetryTime;
	}
	const retryTime = Number(headerValue);
	if (isNaN(retryTime) || retryTime < 0) {
		throw new Error(`Server returned invalid retry time: ${retryTime}`);
	}
	return retryTime;
}

async function realPath(p: string) {
	const stats = await Deno.lstat(p);
	if (stats.isSymlink) {
		return Deno.readLink(p);
	}
	return p;
}

export default async function downloadFile(
	filePath: string,
	url: string,
	urlIndex: number,
	args: Args
) {
	Log.withUrl(false, url, urlIndex, 'started downloading');

	switch (true) {
		case url.slice(0, 8) == 'file:///': {
			const filepath = await realPath(url.slice(8).replaceAll('/', '\\'));

			if (args.noLinks) {
				await fsPromises.copyFile(filepath, filePath);
			} else {
				await fsPromises.symlink(filepath, filePath);
			}

			Log.withUrl(false, url, urlIndex, 'picked local file');

			return;
		}
		default: {
			const result = await downloadRemoteFileWithRetry(
				filePath,
				url,
				args
			);

			if (result.ok) {
				Log.withUrl(false, url, urlIndex, 'downloaded file');
			} else {
				Log.withUrl(
					true,
					url,
					urlIndex,
					`Download error. [${result.status}] ${result.statusText}`
				);
			}
			return;
		}
	}
}

async function downloadRemoteFileWithRetry(
	filePath: string,
	url: string,
	args: Args
) {
	for (let i = 0; ; i++) {
		try {
			const result = await downloadRemoteFile(filePath, url, args);
			// maximum number of retries
			if (i == args.retries) {
				return result;
			}

			await new Promise((resolve) =>
				setTimeout(resolve, result.retryAfter)
			);

			// success or hard failure
			if (
				result.ok ||
				[400, 401, 402, 403, 404, 405, 406, 407, 410].indexOf(
					result.status
				) != -1
			) {
				return result;
			}

			Log.withUrl(true, url, -1, `retry-after: ${result.retryAfter}`);
		} finally {
			// failed, but can try again
		}
	}
}
