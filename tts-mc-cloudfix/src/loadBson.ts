import * as bson from 'npm:bson';

export function loadBson<T>(pathBson: string) {
	const data = Deno.readFileSync(pathBson);
	return bson.deserialize(data) as T;
}
