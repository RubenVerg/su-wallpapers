import { ipcRenderer } from 'electron';

export interface Image {
	sourceUrl: string;
	imageUrl: string;
	description?: string;
	name?: string;
	source?: [1 | 2 | 3 | 4 | 5 | 'f', number, string] | 'movie' | ['other', string];
	category?: string;
}

declare global {
	interface Window {
		ipc: typeof ipcRenderer;
	}

	namespace NodeJS {
		interface Global {
			ipc: typeof ipcRenderer;
		}
	}

	let ipc: typeof ipcRenderer;
}