//      ======================================================
/*        eslint-disable @typescript-eslint/no-unused-vars  */
//      ======================================================

// Existing method that typescript is unaware of
interface String {
    replaceAll(searchValue: string | RegExp, replaceValue: string): string;
}

interface Array<T> {
    remove: (value: T) => number;
}

//      ======================================================
/*        eslint-enable @typescript-eslint/no-unused-vars   */
//      ======================================================

Array.prototype.remove = function <T>(value: T) {
    const me = this as Array<T>;
    const index = me.findIndex((x: T) => x == value);
    if (index != -1) {
        me.splice(index, 1);
    }
    return index;
};
