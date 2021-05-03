// Modules to control application life and create native browser window
import { app, ipcMain, BrowserWindow } from 'electron';
import path from 'path';

import { memoize, memoizeAsync } from './util';

import { all as __allImages, tagged as taggedImages, tags as imagesByTags } from './data';
export const { f: allImages, flush: allImagesFlush } = memoizeAsync(__allImages);

import * as tagData from './data/tags';
import { TagID } from './data/tags';
import { download } from 'electron-dl';
import ElectronStore from 'electron-store';

import type { Tribool } from './Tribool';
const Indeterminate = -1;
const True = 1;
const False = 0;

import bent from 'bent';
const request = bent('buffer');
import fs from 'fs-extra';

import wallpaper from 'wallpaper';

import { install as sourceMap } from 'source-map-support';
sourceMap();

const store = new ElectronStore<Store>({
	defaults: {
		settings: {
			showSaveAsDialog: false,
			dark: Indeterminate,
			theme: null,
		},
		favorites: [],
	}
});

import reloader from 'electron-reloader';
try {
	reloader(module, {
		debug: true,
		ignore: [
			'**/*.ts',
			'**/*.tsx',
			'out/**/*',
			'node_modules/**/*'
		]
	});
} catch (ex) {
	console.error('Electron Reloader exception:', ex);
}

import debug from 'electron-debug';
import { Actions, Requests, Store } from './types';
debug();

import * as util from '@rubenverg/electron-util';
import { format } from 'util';

if (util.is.development) {
	console.log(process.execPath);
	app.setAppUserModelId(process.execPath);
}

process.on('unhandledRejection', err => {
	console.error(err);
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

const requestHandlers: Requests = {
	images: async () => {
		return await allImages();
	},
	taggedImages: async () => {
		return await taggedImages();
	},
	imagesByTags: async (...tags) => {
		return await imagesByTags(...tags);
	},
	tags: async () => {
		return tagData.tagDisplays;
	},
	getSetting: async name => {
		return store.get('settings.' + name);
	},
	favorites: async () => {
		return store.get('favorites');
	},
	isStarred: async id => {
		return store.get('favorites').includes(id);
	}
}

const actionHandlers: Actions = {
	setBackground: async image => {
		try {
			const name = image.replace(/[\/\\:]/g, '');
			console.log(name);
			await saveImageToFolder(image, name);
			await wallpaper.set(path.join(app.getPath('userData'), name));
			return null as Error;
		} catch (ex) {
			console.error(ex);
			return ex as Error;
		}
	},
	download: async (url, options) => {
		try {
			await download(BrowserWindow.getFocusedWindow(), url, {
				onCancel: (item) => {
					console.log('Download for', item, 'canceled.');
				},
				onCompleted: (file) => {
					console.log('Download for', file, 'completed');
				},
				onProgress: (progress) => {
					console.log('Progress downloading', url, ':', progress);
				},
				onStarted: (item) => {
					console.log('Started download for', item);
				},
				onTotalProgress: (progress) => {
					console.log('Total progress in downloads:', progress);
				},
				saveAs: store.get('settings.showSaveAsDialog'),
				...options
			});
			return null as Error;
		} catch (ex) {
			console.error(ex);
			return ex as Error;
		}
	},
	setSetting: async (name, value) => {
		store.set('settings.' + name, value);
	},
	star: async uid => {
		store.set('favorites', [...new Set([...store.get('favorites'), uid])]);
	},
	unstar: async uid => {
		store.set('favorites', store.get('favorites').filter(i => i !== uid));
	},
	'flush!images': async () => {
		allImagesFlush();
	}
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
			try {
				mainWindow.webContents.send(`log!${level}`, ...args);
			} catch (ex) {
				try {
					mainWindow.webContents.send(`log!${level}`, `Plain object attempt (exception ${ex})`, ...args.map(arg => typeof arg !== 'object' ? arg : Array.isArray(arg) ? arg : { ...arg } ));
				} catch (exex) {
					mainWindow.webContents.send(`log!${level}`, `Log in main, but ${ex}! (or ${exex}) Here's a string representation:`, format(...args));
				}
			}
		};
	}
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit();
});


export async function saveImageToFolder(image: string, name: string) {
	const i = await request(image);
	await fs.writeFile(path.join(app.getPath('userData'), name), i);
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
