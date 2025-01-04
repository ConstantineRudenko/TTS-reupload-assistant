import 'MadCakeUtil-ts';
import 'MadCakeUtil-ts-augmentations';
import { Args } from './parseArgs.ts';
import { DownloadResut } from './downloadFile.ts';
import { PriorityQueue } from './PriorityQueue.ts';
import _urlToFname from './urlToCachedFname.ts'; // unused, but keep in case might want to use
import { DownloadSchedule } from './downloadSchedule.ts';
import { getLogger as log } from 'log';
import ProgressReporter from './ProgressReporter.ts';

const extraTimeout = 500;

export interface UrlDownloadTask {
	func: () => Promise<DownloadResut>;
	url: string;
	urlId: number;
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
	log().info('Download queue launched.', {
		numTasks: taskArr.length,
		workers: args.simultaneous,
	});

	const progressReporter = setProgressReporter(taskQueue);
	await Promise.all(
		Array.from({ length: args.simultaneous }).map(
			async () => await worker(taskQueue, args.maxAttempts)
		)
	);
	progressReporter.stop();
}

function setProgressReporter(taskQueue: PriorityQueue<UrlDownloadTask>) {
	const totalTasks = taskQueue.items.length;

	function getPercent() {
		let ratio = 1.0 - taskQueue.items.length / totalTasks;
		ratio = Math.max(0.0, ratio);
		ratio = Math.min(1.0, ratio);
		const percent = (ratio * 100).toFixed(0);
		const numDone = Math.max(0, totalTasks - taskQueue.items.length);
		const numTotal = totalTasks;
		return `${percent}% [${numDone} / ${numTotal}]`;
	}

	const progressReporter = new ProgressReporter().start(getPercent, 2000);
	return progressReporter;
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
			log().error('Download error (gave up)', {
				url: urlDownloadTask.url,
				urlId: urlDownloadTask.urlId,
				status: result.status,
				statusText: result.statusText,
				attemps: urlDownloadTask.attempts,
			});

			continue;
		}

		if (result.status == 'unknown error') {
			log().warn('Download error (will retry).', {
				url: urlDownloadTask.url,
				urlId: urlDownloadTask.urlId,
				status: result.status,
				statusText: result.statusText,
				attemps: urlDownloadTask.attempts,
				retryAfter: result.retryAfterTime,
			});
		}

		// restart after delay
		urlDownloadTask.attempts++;
		urlDownloadTask.schedule = new DownloadSchedule(result.retryAfterTime);
		taskQueue.enqueue(urlDownloadTask);
	}
}
