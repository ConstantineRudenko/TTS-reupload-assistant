// Existing method that typescript is unaware of
interface String {
    replaceAll(searchValue: string | RegExp, replaceValue: string): string;
}

interface Array<T> {
    remove: (value: T) => number;
}

Array.prototype.remove = function (value) {
    const index = this.findIndex((x) => x == value);
    if (index != -1) {
        this.splice(index, 1);
    }
    return index;
};
