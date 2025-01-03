import 'MadCakeUtil-ts';
import 'MadCakeUtil-ts-augmentations';
import * as Log from './logger.ts';
import { Args } from './parseArgs.ts';
import { DownloadResut } from './downloadFile.ts';
import { PriorityQueue } from './PriorityQueue.ts';
import _urlToFname from './urlToCachedFname.ts'; // unused, but keep in case might want to use
import { DownloadSchedule } from './downloadSchedule.ts';

const extraTimeout = 500;

export interface UrlDownloadTask {
	func: () => Promise<DownloadResut>;
	url: string;
	urlIndex: number;
	attempts: number;
	schedule: DownloadSchedule;
}

export async function runDownloadTasks(taskArr: UrlDownloadTask[], args: Args) {
	taskArr = taskArr.slice(); // local copy
	taskArr.reverse();

	const taskQueue = new PriorityQueue<UrlDownloadTask>((a, b) =>
		a.schedule.compare(b.schedule)
	);
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

		const runAfterTime = urlDownloadTask.schedule.runAfterTime;
		if (runAfterTime != null) {
			const delay = runAfterTime - new Date().getTime();
			await sleep(delay + extraTimeout);
		}

		const result = await urlDownloadTask.func();

		// success
		if (result.ok) {
			continue;
		}

		// hard fail or exceeded max attempts
		const hardFailCodes: (typeof result.status)[] = [
			400, 401, 402, 403, 404, 405, 406, 407, 410,
		];
		if (
			urlDownloadTask.attempts == maxAttempts ||
			hardFailCodes.indexOf(result.status) != -1
		) {
			Log.withUrl(
				true,
				urlDownloadTask.url,
				urlDownloadTask.urlIndex,
				`Download error. [${result.status}] ${result.statusText}`
			);

			continue;
		}

		if (result.status == 'unknown error') {
			Log.withUrl(
				true,
				urlDownloadTask.url,
				urlDownloadTask.urlIndex,
				`Download error. ${result.statusText}`
			);
		}

		// restart after delay
		urlDownloadTask.attempts++;
		urlDownloadTask.schedule = new DownloadSchedule(result.retryAfterTime);
		taskQueue.enqueue(urlDownloadTask);
	}
}
