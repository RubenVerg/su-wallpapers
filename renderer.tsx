// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

declare var Masonry: any;
declare var bootstrap: any;

import type { IpcRendererEvent } from 'electron';
import type { Image } from './types';

export function ask<T>(typ: string, ...args: any[]) {
	return new Promise<T>(res => {
		const id = crypto.getRandomValues(new Uint32Array(1))[0];

		const listener = (evt: IpcRendererEvent, rId: number, resp: T) => {
			if (rId == id) {
				ipc.removeListener(`reply!${typ}`, listener);
				res(resp);
			}
		}
		ipc.on(`reply!${typ}`, listener);
		ipc.send(`request!${typ}`, id, ...args);
	});
}

export function act<T>(typ: string, ...args: any[]) {
	return new Promise<T>(res => {
		const id = crypto.getRandomValues(new Uint32Array(1))[0];

		const listener = (evt: IpcRendererEvent, rId: number, resp: T) => {
			if (rId == id) {
				ipc.removeListener(`done!${typ}`, listener);
				res(resp);
			}
		}
		ipc.on(`done!${typ}`, listener);
		ipc.send(`do!${typ}`, id, ...args);
	});
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

function modal(i: Image) {
	return <bs-modal tabindex='-1'>
		<header class='modal-header'>
			<h5 class='modal-title'>
				{i.name}
			</h5>
			<button is='bs-button' variant='close' data-bs-dismiss='modal' aria-label='Close' />
		</header>
		<div class='modal-body'>
			<img src={i.imageUrl} alt={i.description} />
		</div>
		<footer class='modal-footer'>
			<button is='bs-button' variant='secondary' data-bs-dismiss='modal'>
				Close
			</button>
			<button is='bs-button' variant='primary' on-click={() => act('bg', i.imageUrl)}>
				Set as desktop background
			</button>
		</footer>
	</bs-modal>
}

(async () => {
	const images = await ask<Image[]>('images');

	const g = document.createElement('div');
	g.classList.add('row');
	g.id = 'images';

	document.querySelector('#home').appendChild(g);

	for (let img of images) {
		const im = modal(img);
		document.body.appendChild(im);
		const mod = new bootstrap.Modal(im);
		g.appendChild(
			<div class='col-sm-4 col-lg-3 mb-2' on-click={() => {
				console.log('hi');
				mod.show();
			}}>
				<bs-card>
					<img is='card-img' src={img.imageUrl} placement='top' alt={img.description} />
					<div is='card-body'>
						<h5 class='card-title'>{img.name}</h5>
						{img.description && <p class='card-text'>
							{img.description}
						</p>}
						<a href={img.sourceUrl} class='btn btn-outline-secondary'>Source</a>
					</div>
					<footer class='card-footer'>
						{img.source == 'movie' ? 'Steven Universe: The Movie' : img.source[0] == 'other' ? img.source[1] : `${img.source[0]}:${img.source[1]} (${img.source[2]})`}
					</footer>
				</bs-card>
			</div>
		);
	}

	await sleep(1000);

	// debugger;

	const m = new Masonry('#images', {
		// percentPosition: true,
		horizontalOrder: true,
	});

	/*
	const tabs = Array.from(document.querySelectorAll('#navigation button'));
	for (let tab of tabs) {
		const trigger = new bootstrap.Tab(tab);

		tab.addEventListener('click', ev => {
			ev.preventDefault();
			trigger.show();
		});
	}
	*/

	const tagNames = await ask<Record<string, string>>('tags');

	const ti = await ask<Record<string, Image[]>>('taggedImages');

	const t = document.querySelector('#tags');

	const selectors = <div>
		{[...Object.entries(tagNames)].map(([tagId, tagName]) =>
			<div class='form-check'>
				<input class='form-check-input' type='checkbox' value='' id={tagId} data-tag-selector={tagId} />
				<label class='form-check-label' for={tagId}>
					{tagName}
				</label>
			</div>
		)}
	</div>

	const btn = <button is='bs-button' outline variant='success'>
		Update
	</button>

	t.appendChild(selectors);
	t.appendChild(btn);

	console.log(selectors);

	btn.addEventListener('click', () => {
		const srs = [].slice.call(document.querySelectorAll(`[data-tag-selector]`)) as HTMLInputElement[];

		for (let sel of srs) {
			if (sel.checked) {
				document.querySelector(`[data-tag-display="${sel.dataset.tagSelector}"]`).classList.add('d-none');
			} else {
				document.querySelector(`[data-tag-display="${sel.dataset.tagSelector}"]`).classList.remove('d-none');
			}
		}
	});

	for (let cat in ti) {
		t.appendChild(
			<div data-tag-display={cat} class='container'>
				<h3>{cat}</h3>
				<ul>
					{ti[cat].map(img =>
						<li>
							<p>
								<img src={img.imageUrl} style='width: 18rem;' />
								<h6>{img.name}</h6>
							</p>
						</li>
					)}
				</ul>
			</div>
		)
	}
})();
