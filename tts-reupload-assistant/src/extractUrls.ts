export default function extractUrls(saveFileContent: string): string[] {
	const regexUrl =
		/(URL|Url|url)": "(?<url>(\\\\|[a-zA-Z0-9._~:/?#@!$&'()*+,;%=\-[\]\s])+)"/g;

	return Array.from(
		new Set(
			Array.from(saveFileContent.matchAll(regexUrl), (match) => {
				if (match.groups) {
					const value = match.groups['url'];
					if (value) {
						return [value];
					}
					return [];
				}
				return [];
			}).flat()
		)
	).filter((x) => x.slice(0, 16) == 'http://paste.ee/');
}
