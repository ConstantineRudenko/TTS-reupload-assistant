import { Args } from './parseArgs.ts';
import fsPromises from 'node:fs/promises';
import { getLogger } from 'log';

function defaultRetryTime() {
	return new Date().getTime() + 10000;
}

const logger = getLogger();

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

export interface DownloadResut {
	ok: boolean;
	status: number | 'abort' | 'unknown error';
	statusText: string;
	retryAfterTime: number;
}

async function downloadRemoteFile(
	filePath: string,
	url: string,
	args: Args
): Promise<DownloadResut> {
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
			retryAfterTime: getRetryTime(response),
		};
	} catch (err: unknown) {
		const error = err as Partial<Error>;
		if (error.name == 'AbortError') {
			return {
				ok: false,
				status: 'abort',
				statusText: 'Timed out without server response.',
				retryAfterTime: defaultRetryTime(),
			};
		}
		return {
			ok: false,
			status: 'unknown error',
			statusText: `[Unknown error: ${error.name}] ${error.message}`,
			retryAfterTime: defaultRetryTime(),
		};
	}
}

function getRetryTime(response: Response): number {
	const headerValue = response.headers.get('Retry-After');
	if (headerValue == null) {
		return [408, 429].indexOf(response.status) == -1
			? new Date().getTime()
			: defaultRetryTime();
	}
	const retryTime = Number(headerValue);

	if (isNaN(retryTime) || retryTime < 0) {
		throw new Error(`Server returned invalid retry time: ${retryTime}`);
	}

	// server returned 0
	if (retryTime == 0) {
		return defaultRetryTime();
	}

	return new Date().getTime() + retryTime * 1000;
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
): Promise<DownloadResut> {
	logger.debug('Started downloading.', { url, urlIndex });

	switch (true) {
		case url.slice(0, 8) == 'file:///': {
			const filepath = await realPath(url.slice(8).replaceAll('/', '\\'));

			if (args.noLinks) {
				await fsPromises.copyFile(filepath, filePath);
			} else {
				await fsPromises.symlink(filepath, filePath);
			}

			logger.debug('Picked local file', { url, urlIndex });

			return {
				ok: true,
				retryAfterTime: 0,
				status: 0,
				statusText: '',
			};
		}
		default: {
			const result = await downloadRemoteFile(filePath, url, args);

			return result;
		}
	}
}
