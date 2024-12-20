declare global {
	interface Array<T> {
		remove(value: T): void;
	}
}

Array.prototype.remove = function <T>(value: T) {
	const me = this as Array<T>;
	const index = me.findIndex((x: T) => x == value);
	if (index != -1) {
		me.splice(index, 1);
	}
	return index;
};
