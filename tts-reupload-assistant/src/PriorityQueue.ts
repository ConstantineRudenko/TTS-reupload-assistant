type Comparator<T> = (a: T, b: T) => number;

export class PriorityQueue<T> {
	compare: Comparator<T>;
	items = new Array<T>();

	constructor(compare: Comparator<T>) {
		this.compare = compare;
	}

	get size() {
		return this.items.length;
	}

	get isEmpty() {
		return this.items.length == 0;
	}

	enqueue(item: T): number {
		let left = 0;
		let right = this.items.length;
		while (true) {
			const mid = Math.floor((left + right) / 2);
			const midItem = this.items[mid];
			if (this.compare(midItem, item) < 0) {
				left = mid + 1;
			} else {
				right = mid;
			}

			if (left == right) {
				this.items.splice(mid, 0, item);
				return right;
			}
		}
	}

	dequeue() {
		return this.items.shift();
	}
}
