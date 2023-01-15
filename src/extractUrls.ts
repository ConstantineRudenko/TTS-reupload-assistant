export default function extractUrls(saveFileContent: string): string[] {
    const regexUrl = /URL": "([a-zA-Z0-9._~:/?#@!$&'()*+,;%=\-[\]\s]+)"/g;

    return [
        ...new Set(
            Array.from(saveFileContent.matchAll(regexUrl), function (match) {
                return match[1];
            })
        ),
    ];
}
