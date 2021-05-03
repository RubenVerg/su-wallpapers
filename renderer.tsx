// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

declare var Masonry: any;
declare var bootstrap: any;
declare var _: typeof import('lodash');

import type { IpcRendererEvent } from 'electron';
import type { Actions, Image, Requests, Settings } from './types';
import type { Tribool } from './Tribool';
const Indeterminate: Tribool = -1;
const True: Tribool = 1;
const False: Tribool = 0;

export function ask<
	Request extends keyof Requests,
>(typ: Request, ...args: (Parameters<Requests[Request]> extends any[] ? Parameters<Requests[Request]> : any[])) {
	return new Promise<ReturnType<Requests[Request]>>(res => {
		const id = crypto.getRandomValues(new Uint32Array(1))[0];

		const listener = (evt: IpcRendererEvent, rId: number, resp: ReturnType<Requests[Request]>) => {
			if (rId == id) {
				ipc.removeListener(`reply!${typ}`, listener);
				res(resp);
			}
		}
		ipc.on(`reply!${typ}`, listener);
		ipc.send(`request!${typ}`, id, ...args);
	});
}

export function act<
	Action extends keyof Actions
>(typ: string, ...args: (Parameters<Actions[Action]> extends any[] ? Parameters<Actions[Action]> : any[])) {
	return new Promise<ReturnType<Actions[Action]>>(res => {
		const id = crypto.getRandomValues(new Uint32Array(1))[0];

		const listener = (evt: IpcRendererEvent, rId: number, resp: ReturnType<Actions[Action]>) => {
			if (rId == id) {
				ipc.removeListener(`done!${typ}`, listener);
				res(resp);
			}
		}
		ipc.on(`done!${typ}`, listener);
		ipc.send(`do!${typ}`, id, ...args);
	});
}

export async function setting<Setting extends keyof Settings>(key: Setting): Promise<Settings[Setting]>
export async function setting<Setting extends keyof Settings>(key: Setting, value: Settings[Setting]): Promise<void>
export async function setting<Setting extends keyof Settings>(key: Setting, value?: Settings[Setting]) {
	if (arguments.length >= 2) {
		await act('setSetting', key, value);
	} else {
		return await ask('getSetting', key) as Settings[Setting];
	}
}

for (let level of ['info', 'warn', 'error', 'debug', 'log']) {
	ipc.on(`log!${level}`, (evt, ...ths) => console[level](`Main says: -->`, ...ths));
}

export function html(htmlString: string) {
	const template = document.createElement('template');
	template.innerHTML = htmlString;
	return template.content.cloneNode(true) as DocumentFragment;
}

export function sleep(ms: number) {
	return new Promise<void>(r => {
		setTimeout(() => r(), ms);
	})
}

let favoritesUpdate: () => Promise<void>;

async function toggleStar(id: string) {
	if (await ask('isStarred', id)) await act('unstar', id);
	else await act('star', id);
}

export class ComparedMap<K, V> extends Map<K, V> {
	constructor(public readonly comparator: (a: K, b: K) => boolean) {
		super([]);
	}

	set(k: K, v: V): this {
		super.set(
			[...this.entries()]
				.find(([kk, vv]) => this.comparator(k, kk))
				?.[0] ?? k,
			v
		);

		return this;
	}

	get(k: K) {
		return super.get(
			[...this.entries()]
				.find(([kk, vv]) => this.comparator(k, kk))
				?.[0] ?? k
		)
	}

	has(k: K) {
		return [...this.entries()].some(([kk, vv]) => this.comparator(k, kk));
	}

	delete(k: K) {
		return super.delete(
			[...this.entries()]
				.find(([kk, vv]) => this.comparator(k, kk))
				?.[0] ?? k
		);
	}
}

async function refreshFavorites() {
	const buttons = Array.from(document.querySelectorAll('[data-this-is-a="starButton"]')) as HTMLElement[];

	for (let button of buttons) {
		const label = button.querySelector('x-label');
		const id = button.dataset.thisIsADataId;
		const starred = await ask('isStarred', id);
		if (starred) label.textContent = 'Unstar';
		else label.textContent = 'Star';
		const icon = button.querySelector('x-icon');
		icon?.setAttribute?.('name', starred ? 'star-fill' : 'star');
	}

	await favoritesUpdate();
}

const knownModalImages = new ComparedMap<Image, HTMLDialogElement>(_.isEqual);
function modal(i: Image) {
	if (knownModalImages.has(i)) return knownModalImages.get(i);
	const dial = <dialog class='dialog-image' data-this-is-a='imageModal' data-this-is-a-data-id={i.uid}>
		<header>
			<h3>
				{i.name}
			</h3>
			<x-button on-click={() => {
				dial.close();
			}} aria-label='Close'>
				<x-icon name='x' />
			</x-button>
		</header>
		<main>
			<img src={i.imageUrl} alt={i.description}
			// style="max-width: 75vw; min-width: 50vw;"
			/>
		</main>
		<footer>
			<x-button on-click={() => {
				dial.close();
			}}>
				<x-label>Close</x-label>
			</x-button>
			<x-button on-click={() => {
				window.electronUtil.openUrl(i.sourceUrl);
			}}>
				<x-icon name='link' />
				<x-label>Source</x-label>
			</x-button>
			<x-button data-this-is-a='starButton' data-this-is-a-data-id={i.uid} on-click={() => {
				const th = document.querySelector(`[data-this-is-a="starButton"][data-this-is-a-data-id="${i.uid}"`) as HTMLElement;
				th.querySelector('x-label').textContent = 'Loading...';
				toggleStar(i.uid).then(refreshFavorites);
			}}>
				<x-icon name='star' />
				<x-label>~~?~~Star</x-label>
			</x-button>
			<x-button on-click={() => {
				act('setBackground', i.imageUrl)
			}}>
				<x-icon name='cast' />
				<x-label>Set as desktop background</x-label>
			</x-button>
			<x-button on-click={() => {
				act('download', i.imageUrl, {
					saveAs: true
				});
			}}>
				<x-icon name='box-arrow-in-down' />
				<x-label>Save to disk</x-label>
			</x-button>
		</footer>
	</dialog>
	document.body.appendChild(dial);
	knownModalImages.set(i, dial);
	return dial;
}

function modalImage(i: Image, n: string = 'img', args: Record<string, string> = {}): HTMLImageElement {
	const m = modal(i);
	const image = window.jsx.createElement(n, {
		src: i.imageUrl,
		alt: i.name + ': ' + i.description,
		'on-click': () => {
			m.showModal();
		},
		...args
	}) as unknown as HTMLImageElement;
	return image;
}

function cardImage(i: Image) {
	return <x-card style='width: 18rem;'>
		<main>
			{modalImage(i, 'img', {
				style: 'width: 100%;'
			})}
			<h5>{i.name}</h5>
			{i.description && <p class='card-text'>
				{i.description}
			</p>}
		</main>
		<footer>
			{i.source == 'movie' ? 'Steven Universe: The Movie' : i.source[0] == 'other' ? i.source[1] : `${i.source[0]}:${i.source[1]} (${i.source[2]})`}
		</footer>
	</x-card>
}

async function tabFixer() {
	const xTabs: any = document.querySelector('#navigation');
	xTabs.addEventListener('change', () => {
		Array.from(xTabs.children as (HTMLElement & { value: string })[]).forEach(tab => (document.querySelector(tab.value) as HTMLElement).style.display = 'none');
		document.querySelector(xTabs.value).style.display = 'unset';
	});
}

async function allImages() {
	const images = await ask('images');

	const g = document.createElement('div');
	g.classList.add('row');
	g.id = 'images';

	document.querySelector('#home').innerHTML = '';
	document.querySelector('#home').appendChild(g);

	for (let img of images) g.appendChild(cardImage(img));
}

async function tags() {
	const tagNames = await ask('tags');

	const ti = await ask('taggedImages');

	const t = document.querySelector('#tags');
	t.innerHTML = '';

	const selectors = <div>
		{[...Object.entries(tagNames)].map(([tagId, tagName]) =>
			<x-checkbox data-tag-selector={tagId}>
				<x-label>
					{tagName}
				</x-label>
			</x-checkbox>
		)}
	</div>

	const btn = <x-button>
		<x-icon name='arrow-repeat' />
		<x-label>
			Update
		</x-label>
	</x-button>

	t.appendChild(selectors);
	t.appendChild(btn);

	console.log(selectors);

	btn.addEventListener('click', () => {
		const srs = [].slice.call(document.querySelectorAll(`[data-tag-selector]`)) as (HTMLElement & { toggled: boolean })[];

		for (let sel of srs) {
			if (sel.toggled) {
				document.querySelector(`[data-tag-display="${sel.dataset.tagSelector}"]`).classList.add('d-none');
			} else {
				document.querySelector(`[data-tag-display="${sel.dataset.tagSelector}"]`).classList.remove('d-none');
			}
		}
	});

	for (let cat in ti) {
		t.appendChild(
			<x-box data-tag-display={cat}>
				<h3>{cat}</h3>
				<ul>
					{ti[cat].map(img => <li>{cardImage(img)}</li>)}
				</ul>
			</x-box>
		)
	}
}

async function favorites() {
	let favs: string[] = [];
	let imgs: Image[] = [];

	async function update() {
		favs = await ask('favorites');
		imgs = await ask('images');
		await render();
	}

	favoritesUpdate = update;

	async function render() {
		const container = document.querySelector('#favorites');
		container.innerHTML = '';
		container.appendChild(<x-button on-click={update}>
			<x-label>Refresh</x-label>
		</x-button>)
		for (let fav of favs) {
			const img = imgs.find(image => image.uid === fav);
			container.appendChild(cardImage(img));
		}
	}

	await update();
}

async function settings() {
	const s = document.querySelector('#settings');
	s.innerHTML = '';
	s.appendChild(<x-checkbox>

	</x-checkbox>)
}

async function preLoadSettings() {
	const metaTheme = document.querySelector('meta[name="xel-theme"]') as HTMLMetaElement;
	const dark = await setting('dark') === Indeterminate ? electronUtil.nativeTheme.dark : await setting('dark');
	const themeName = await setting('theme') ?? electronUtil.byPlatform({
		windows: 'fluent',
		macos: 'cupertino',
		default: 'vanilla'
	});
	metaTheme.content = `./node_modules/xel/themes/${themeName}${dark ? '-dark' : ''}.css`;
}

async function postLoadSettings() { }

preLoadSettings().then(() => Promise.all([
	tabFixer(),
	allImages(),
	tags(),
	favorites(),
	settings(),
])).then(() => Promise.all([
	refreshFavorites(),
	postLoadSettings(),
])).then(() => {
	document.querySelector('#loading').classList.add('d-none');
});