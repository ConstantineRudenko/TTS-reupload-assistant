import './lib/extendBuiltin';
import * as Log from './logger';
import { Args } from './parseArgs';

export interface UrlDownloadTask {
    func: () => Promise<unknown>;
    url: string;
    urlIndex: number;
    started: number;
}

export async function runDownloadTasks(taskArr: UrlDownloadTask[], args: Args) {
    taskArr = taskArr.slice(); // local copy
    taskArr.reverse();

    const taskArrActive: UrlDownloadTask[] = [];

    Log.normal(`queue size: ${taskArr.length}`);
    Log.normal(`simultaneous downloads: ${args.simultaneous}`);

    await Promise.all(
        Array(args.simultaneous)
            .fill(0)
            .map(() =>
                (async () => {
                    while (taskArr.length > 0) {
                        const promiseInfo = taskArr.pop();
                        taskArrActive.push(promiseInfo);
                        promiseInfo.started = Date.now();

                        printQueue(taskArrActive);

                        Log.withUrl(
                            promiseInfo.url,
                            promiseInfo.urlIndex,
                            'queued url download'
                        );

                        await promiseInfo.func();

                        Log.withUrl(
                            promiseInfo.url,
                            promiseInfo.urlIndex,
                            'processed URL'
                        );

                        taskArrActive.remove(promiseInfo);
                    }
                })()
            )
    );
}

function printQueue(promiseInfoArrActive: UrlDownloadTask[]) {
    const now = Date.now();

    const numTasks = promiseInfoArrActive.length;

    if (numTasks > 0) {
        Log.spaced(`active tasks (${numTasks}):`);

        promiseInfoArrActive.forEach((promiseInfo) => {
            const sPassed = ((now - promiseInfo.started) / 1000).toFixed();
            Log.withUrl(
                promiseInfo.url,
                promiseInfo.urlIndex,
                `(${sPassed} seconds ago)`
            );
        });
    } else {
        Log.normal('no tasks left');
    }
}
