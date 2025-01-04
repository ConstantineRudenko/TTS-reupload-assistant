import { getLogger as log } from 'log/get-logger';

export default class ProgressReporter {
	private getProgress: () => string;
	private intervalId: number | undefined;

	private log() {
		return log('progress');
	}

	constructor() {
		this.getProgress = () => {
			throw new Error('getProgress() not set');
		};
		this.intervalId = undefined;
	}

	start(getProgress: () => string, interval: number) {
		this.getProgress = getProgress;
		this.intervalId = setInterval(() => {
			this.log().info(`Progress: ${this.getProgress()}`);
		}, interval);
		return this;
	}

	stop() {
		clearInterval(this.intervalId);
	}
}
