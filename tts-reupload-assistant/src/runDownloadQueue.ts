import 'MadCakeUtil-ts';
import 'MadCakeUtil-ts-augmentations';
import * as Log from './logger.ts';
import { Args } from './parseArgs.ts';
import { DownloadResut } from './downloadFile.ts';

export interface UrlDownloadTask {
	func: () => Promise<DownloadResut>;
	url: string;
	urlIndex: number;
	attempts: number;
}

export async function runDownloadTasks(taskArr: UrlDownloadTask[], args: Args) {
	taskArr = taskArr.slice(); // local copy
	taskArr.reverse();

	Log.normal(true, `queue size: ${taskArr.length}`);
	Log.normal(true, `simultaneous downloads: ${args.simultaneous}`);

	await Promise.all(
		Array.from({ length: args.simultaneous }).map(
			async () => await worker(taskArr, args.maxAttempts)
		)
	);
}

async function worker(taskArr: UrlDownloadTask[], maxAttempts: number) {
	while (taskArr.length > 0) {
		const urlDownloadTask: UrlDownloadTask = taskArr.pop()!;

		const result = await urlDownloadTask.func();

		// success
		if (result.ok) {
			continue;
		}

		// log retry
		Log.withUrl(
			true,
			urlDownloadTask.url,
			urlDownloadTask.urlIndex,
			`Retry. [${result.status}] ${result.statusText} (timeout: ${result.retryAfter})`
		);

		// hard fail or exceeded max attempts
		if (
			urlDownloadTask.attempts == maxAttempts ||
			[400, 401, 402, 403, 404, 405, 406, 407, 410].indexOf(
				result.status
			) != -1
		) {
			Log.withUrl(
				true,
				urlDownloadTask.url,
				urlDownloadTask.urlIndex,
				`Download error. [${result.status}] ${result.statusText}`
			);

			continue;
		}

		// restart after delay
		await Promise.all([
			// keep the worker spinning
			async () => await worker(taskArr, maxAttempts),
			// fork worker into retry scheduler
			async () => {
				await new Promise((resolve) =>
					setTimeout(resolve, result.retryAfter)
				);

				urlDownloadTask.attempts++;
				taskArr.push(urlDownloadTask);

				return;
			},
		]);
	}
}
