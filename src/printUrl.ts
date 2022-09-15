export function printUrl(urlIndex: number, url: string) {
    const width = 40;

    const result: string[] = [];
    [...url].forEach((c, i) => {
        if (i && i % width == 0) {
            result.push('\n    ');
        }
        result.push(c);
    });

    console.log(`    [${urlIndex}]`);
    console.log('    '.concat(...result));
}
