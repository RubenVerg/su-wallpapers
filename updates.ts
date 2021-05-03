import { Notification } from 'electron';
import { allImages, allImagesFlush, saveImageToFolder } from '.';
import { all as refreshed } from './data';
import _ from 'lodash';
import * as util from '@rubenverg/electron-util';
import path from 'path';
import { app } from 'electron';

export async function handler() {
	const known = await allImages()
	const updated = await refreshed();

	const unknown = updated
		.map(i => [
			!known.some(ii => _.isEqual(i, ii)),
			i
		] as const)
		.filter(([keep]) => keep)
		.map(([_, image]) => image);

	for (let img of unknown) {
		const safeName = img.imageUrl.replace(/[\/\\:]/g, '');

		await saveImageToFolder(img.imageUrl, safeName);

		const n = new Notification({
			...util.byPlatform({
				macos: {
					title: `New image`,
					subtitle: img.name
				},
				default: {
					title: `New image: ${img.name}`,
				}
			}),
			body: `Ajit-Pajouhesh uploaded a new wallpaper!`,
			icon: path.join(app.getPath('userData'), safeName)
		});

		n.show();
	}

	if (updated.length > 0) allImagesFlush();

	return updated;
}

const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

export default async () => {
	while (true) {
		handler();
		await sleep(60 * 1000); // 1 minute
	}
};
