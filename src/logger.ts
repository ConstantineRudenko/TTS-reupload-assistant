export function spaced(message: string) {
    console.log(message);
    console.log('');
}

export function normal(message: string) {
    console.log(message);
}

export function withUrl(url: string, urlIndex: number, message: string) {
    console.log(`[${urlIndex}] "${url}"`);
    console.log(message);
    console.log('');
}
