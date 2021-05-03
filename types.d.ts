import { ipcRenderer } from 'electron';
import * as util from '@rubenverg/electron-util/safe';
import { TaggedImages, TagID } from './data/tags';
import { Tribool } from './Tribool';
import Lodash from 'lodash';

export interface DownloadSettings {
	saveAs?: boolean;
}

export type Handler<Args extends any[], Return> = (...args: Args) => Promise<Return>

export interface Requests {
	images: Handler<[], Image[]>;
	taggedImages: Handler<[], Record<string, Image[]>>;
	imagesByTags: Handler<TagID[], Partial<TaggedImages>>;
	tags: Handler<[], Record<TagID, string>>;
	getSetting: Handler<[string], unknown>;
	favorites: Handler<[], string[]>;
	isStarred: Handler<[string], boolean>;
}

export interface Actions {
	setBackground: Handler<[string], Error | null>;
	download: Handler<[string] | [string, DownloadSettings], Error | null>;
	setSetting: Handler<[string, unknown], void>;
	star: Handler<[string], void>;
	unstar: Handler<[string], void>;
	'flush!images': Handler<[], void>;
}

export interface Store {
	settings: Settings;
	favorites: string[];
}

export type Theme = 'fluent' | 'cupertino' | 'vanilla' | null;

export interface Settings {
	showSaveAsDialog: boolean;
	dark: Tribool;
	theme: Theme;
}

export interface Image {
	uid: string;
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
		electronUtil: typeof util;
		_: typeof Lodash;
	}

	namespace NodeJS { 
		interface Global {
			ipc: typeof ipcRenderer;
			electronUtil: typeof util;
			_: typeof Lodash;
		}
	}

	let ipc: typeof ipcRenderer;
	let electronUtil: typeof util;
	let _: typeof Lodash;
}