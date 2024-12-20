export function spaced(hackEnable: boolean, message: string) {
	if (!hackEnable) return;

	console.log(message);
	console.log('');
}

export function normal(hackEnable: boolean, message: string) {
	if (!hackEnable) return;

	console.log(message);
}

export function withUrl(
	hackEnable: boolean,
	url: string,
	urlIndex: number,
	message?: string
) {
	if (!hackEnable) return;

	console.log(`[${String(urlIndex).padStart(4)}] "${url}"`);
	if (message != undefined) {
		console.log(message);
	}
	console.log('');
}
