import 'MadCakeUtil-ts';
import 'MadCakeUtil-ts-augmentations';
import * as Log from './logger.ts';
import { Args } from './parseArgs.ts';
import { DownloadResut } from './downloadFile.ts';
import { PriorityQueue } from './PriorityQueue.ts';

export interface UrlDownloadTask {
	func: () => Promise<DownloadResut>;
	url: string;
	urlIndex: number;
	attempts: number;
	runAfterTimestamp: number;
}

export async function runDownloadTasks(taskArr: UrlDownloadTask[], args: Args) {
	taskArr = taskArr.slice(); // local copy
	taskArr.reverse();

	const taskQueue = new PriorityQueue<UrlDownloadTask>((a, b) => {
		switch (true) {
			case a.runAfterTimestamp == b.runAfterTimestamp:
				return 0;
			case a.runAfterTimestamp < b.runAfterTimestamp:
				return -1;
			default:
				return 1;
		}
	});
	for (const task of taskArr) {
		taskQueue.enqueue(task);
	}

	Log.normal(true, `queue size: ${taskArr.length}`);
	Log.normal(true, `simultaneous downloads: ${args.simultaneous}`);

	await Promise.all(
		Array.from({ length: args.simultaneous }).map(
			async () => await worker(taskQueue, args.maxAttempts)
		)
	);
}

async function sleep(milliseconds: number) {
	await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function worker(
	taskQueue: PriorityQueue<UrlDownloadTask>,
	maxAttempts: number
) {
	while (!taskQueue.isEmpty) {
		const urlDownloadTask: UrlDownloadTask = taskQueue.dequeue()!;

		const delay = urlDownloadTask.runAfterTimestamp - new Date().getTime();
		if (delay > 0) {
			await sleep(delay);
		}

		const result = await urlDownloadTask.func();

		// success
		if (result.ok) {
			continue;
		}

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
		urlDownloadTask.attempts++;
		taskQueue.enqueue(urlDownloadTask);
	}
}
