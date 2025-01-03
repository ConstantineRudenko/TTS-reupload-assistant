import * as bson from 'npm:bson';

export function loadBsonSync<T>(pathBson: string) {
	const data = Deno.readFileSync(pathBson);
	return bson.deserialize(data) as T;
}

export function saveBsonSync<T extends bson.Document>(
	data: T,
	pathBson: string
) {
	Deno.writeFileSync(pathBson, bson.serialize(data));
}
