import * as bson from 'npm:bson';
import * as path from 'jsr:@std/path';

/**
 *
 * @param pathCloud Folder with "CloudFolder.bson" and "CloudInfo.bson". Example: "E:/Games/Steam/userdata/391694214/286160/remote/".
 */
export default function fixCloudFolders(pathCloud: string) {
	const pathCloudFolder = path.join(pathCloud, 'CloudFolder.bson');
	const pathCloudInfo = path.join(pathCloud, 'CloudInfo.bson');

	function loadBson<T>(pathBson: string) {
		const data = Deno.readFileSync(pathBson);
		return bson.deserialize(data) as T;
	}

	type CloudInfo = Record<
		string,
		{
			Name: string;
			URL: string;
			Size: number;
			Date: string;
			Folder: string;
		}
	>;

	type CloudFolder = Record<string, string>;

	const cloudInfo = loadBson<CloudInfo>(pathCloudInfo);
	const folders = new Set(
		Object.entries(cloudInfo).map(([_, value]) => value.Folder)
	);
	const foldersWithSubfolders = new Set(
		Array.from(folders).flatMap((folder) => {
			const parts = folder.split('\\');
			return parts.map((_, index, parts) =>
				parts.slice(0, index + 1).join('\\')
			);
		})
	);
	const cloudFolder = Object.fromEntries(
		Array.from(foldersWithSubfolders)
			.sort()
			.filter((folder) => folder != '')
			.map((value, index) => [String(index), value])
	);

	const cloudFolderBson = bson.serialize(cloudFolder, {});
	Deno.writeFile(pathCloudFolder, cloudFolderBson);

	console.log(
		JSON.stringify(loadBson<CloudFolder>(pathCloudFolder), null, 2)
	);
}
