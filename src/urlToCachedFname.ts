const regexUrlCleanup = /[:\/\-\.\?=]/g;

export default function urlToFname(url: string): string {
    return url.replace(regexUrlCleanup, "");
}
