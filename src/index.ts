// Modules to control application life and create native browser window
import { app, ipcMain, BrowserWindow } from 'electron';
import path from 'path';

import reddit1, { tagged as taggedReddit1 } from './data/reddit1';

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

const requestHandlers: Record<string, (...args: any[]) => any | Promise<any>> = {
    images: async () => {
        return await reddit1();
    },
    taggedImages: async () => {
        return await taggedReddit1();
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

    for (let level of ['info', 'warn', 'error', 'debug', 'log']) {
        // @ts-ignore
        console[level] = (...args) => mainWindow.webContents.send(`log!${level}`, ...args);
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
