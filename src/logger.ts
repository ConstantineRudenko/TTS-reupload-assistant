export function spaced(message: string) {
    console.log(message);
    console.log('');
}

export function normal(message: string) {
    console.log(message);
}

export function withUrl(url: string, urlIndex: number, message?: string) {
    console.log(`[${String(urlIndex).padStart(4)}] "${url}"`);
    if (message != undefined) {
        console.log(message);
    }
    console.log('');
}
