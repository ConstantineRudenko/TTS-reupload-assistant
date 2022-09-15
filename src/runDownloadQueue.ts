import "./lib/extendBuildin";
import { Args } from "./parseArgs";
import { printUrl } from "./printUrl";

export interface UrlDownloadTask {
    func: () => Promise<any>;
    url: string;
    urlIndex: number;
    started: number;
}

export async function runDownloadTasks(taskArr: UrlDownloadTask[], args: Args) {
    taskArr = taskArr.slice(); // local copy
    taskArr.reverse();

    const taskArrActive: UrlDownloadTask[] = [];

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

                        console.log("queued url download:");
                        printUrl(promiseInfo.urlIndex, promiseInfo.url);

                        await promiseInfo.func();

                        console.log("processed url:");
                        printUrl(promiseInfo.urlIndex, promiseInfo.url);

                        taskArrActive.remove(promiseInfo);
                    }

                    if (taskArrActive.length == 0) {
                        console.log("end of the download queue");
                    }
                })()
            )
    );
}

function printQueue(promiseInfoArrActive: UrlDownloadTask[]) {
    const now = Date.now();

    const numTasks = promiseInfoArrActive.length;

    if (numTasks > 0) {
        console.log(`active tasks (${numTasks}):`);

        promiseInfoArrActive.forEach((promiseInfo) => {
            const sPassed = ((now - promiseInfo.started) / 1000).toFixed();
            console.log(`    (${sPassed} seconds ago)`);
            printUrl(promiseInfo.urlIndex, promiseInfo.url);
        });
    } else {
        console.log("no tasks left");
    }
}
