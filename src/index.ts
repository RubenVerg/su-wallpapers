// Modules to control application life and create native browser window
import { app, ipcMain, BrowserWindow } from 'electron';
import path from 'path';

import { all as allImages, tagged as taggedImages, tags as imagesByTags } from './data';
import * as tagData from './data/tags';
import { TagID } from './data/tags';

import bent from 'bent';
const request = bent('buffer');
import fs from 'fs-extra';

import wallpaper from 'wallpaper';

import { install } from 'source-map-support';
install();

process.on('unhandledRejection', err => {
	throw err;
});

function createWindow() {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: false
		}
	});

	// and load the index.html of the app.
	mainWindow.loadFile('index.html');

	// Open the DevTools.
	mainWindow.webContents.openDevTools()
}

type Handler<Args extends any[], Return> = (...args: Args) => Return | PromiseLike<Return>

const requestHandlers: Record<string, Handler<unknown[], unknown>> = {
	images: async () => {
		return await allImages();
	},
	taggedImages: async () => {
		return await taggedImages();
	},
	imagesByTags: async (...tags: TagID[]) => {
		return await imagesByTags(...tags);
	},
	tags: () => {
		return tagData.tagDisplays;
	},
}

const actionHandlers: Record<string, Handler<unknown[], unknown>> = {
	bg: async (image: string) => {
		try {
			const name = image.replace(/[\/\\:]/g, '');
			console.log(name);
			const i = await request(image);
			await fs.writeFile(path.join(app.getPath('userData'), name), i);
			await wallpaper.set(path.join(app.getPath('userData'), name));
			return null as Error;
		} catch (ex) {
			return ex as Error;
		}
	},
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
	createWindow();

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});

	const mainWindow = BrowserWindow.getAllWindows()[0];

	for (let req in requestHandlers) {
		ipcMain.on(`request!${req}`, async (evt, id: number, ...args: any[]) => {
			evt.reply(`reply!${req}`, id, await requestHandlers[req](...args));
		});
	}

	for (let act in actionHandlers) {
		ipcMain.on(`do!${act}`, async (evt, id: Number, ...args: any[]) => {
			evt.reply(`done!${act}`, id, await actionHandlers[act](...args));
		})
	}

	for (let level of ['info', 'warn', 'error', 'debug', 'log']) {
		const original = console[level].bind(console);
		// @ts-ignore
		console[level] = (...args: any[]) => {
			original(...args);
			mainWindow.webContents.send(`log!${level}`, ...args);
		};
	}
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
