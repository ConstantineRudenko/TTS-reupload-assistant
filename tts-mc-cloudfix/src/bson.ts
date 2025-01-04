import * as bson from 'bson';

export function loadBsonSync<
	T extends [] | Record<string | number | symbol, unknown>
>(pathBson: string) {
	try {
		const data = Deno.readFileSync(pathBson);
		return bson.deserialize(data) as T;
	} catch (err: any) {
		return {} as T;
	}
}

export function saveBsonSync<T extends bson.Document>(
	data: T,
	pathBson: string
) {
	Deno.writeFileSync(pathBson, bson.serialize(data));
}
