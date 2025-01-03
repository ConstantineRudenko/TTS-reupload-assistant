export class DownloadSchedule {
	public readonly runAfterTime: number | null = null;

	constructor();
	constructor(runAfterTime: number);
	constructor(runAfterTime?: number) {
		this.runAfterTime = runAfterTime ?? null;
	}

	compare(other: DownloadSchedule) {
		if (this.runAfterTime == null) {
			if (other.runAfterTime == null) {
				return 0;
			}
			return 1;
		}

		if (other.runAfterTime == null) {
			return -1;
		}

		if (this.runAfterTime < other.runAfterTime) {
			return -1;
		}

		if (this.runAfterTime == other.runAfterTime) {
			return 0;
		}

		return 1;
	}
}
