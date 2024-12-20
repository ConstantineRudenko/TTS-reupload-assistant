const regexUrlCleanup = /[^a-zA-Z0-9]/g;

export default function urlToFname(url: string): string {
    return url.replace(regexUrlCleanup, '');
}
