function escapeRegExp(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// not very optimal, but definitely better than running String.replace() in a loop
export function replaceBulk(s: string, replacements: Record<string, string>) {
	const regex = RegExp(
		Object.keys(replacements).map(escapeRegExp).join('|'),
		'g'
	);
	return s.replaceAll(regex, (match) => replacements[match]);
}
