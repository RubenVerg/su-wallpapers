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

for (let level of ['info', 'warn', 'error', 'debug', 'log']) {
    ipc.on(`log!${level}`, (evt, ...ths) => console[level](`Main says: `, ...ths));
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

(async () => {
	const images = await ask<Image[]>('images');

	const g = document.createElement('div');
	g.classList.add('row');
	g.id = 'images';

	document.querySelector('#home').appendChild(g);

	for (let img of images) {
		g.appendChild(html(`
		<div class='col-sm-4 col-lg-3 mb-2'>
			<div class='card'>
				<img src='${img.imageUrl}' class='card-img-top' alt='${img.description}' />
				<div class='card-body'>
					<h5 class='card-title'>${img.name}</h5>
					${img.description ? `<p class='card-text'>
						${img.description}
					</p>` : ''}
					<a href='${img.sourceUrl}' class='btn btn-outline-secondary'>Open Source</a>
				</div>
				<footer class='card-footer'>
					${img.source == 'movie' ? 'Steven Universe: The Movie' : img.source[0] == 'other' ? img.source[1] : `${img.source[0]}:${img.source[1]} (${img.source[2]})`}
				</footer>
			</div>
		</div>
		`));
	}

	await sleep(1000);

	// debugger;

	const m = new Masonry('#images', {
		// percentPosition: true,
		horizontalOrder: true,
	});

    const tabs = Array.from(document.querySelectorAll('#navigation button'));
    for (let tab of tabs) {
        const trigger = new bootstrap.Tab(tab);

        tab.addEventListener('click', ev => {
            ev.preventDefault();
            trigger.show();
        });
    }

    const ti = await ask<Record<string, Image[]>>('taggedImages');

    const t = document.querySelector('#tags');

    for (let cat in ti) {
        t.appendChild(html(`<h3>${cat}</h3>`));
        t.appendChild(html(`
        <ul>
            ${ti[cat].map(img => {
                return `
                <li>
                    <p>
                        <img src='${img.imageUrl}' style='width: 18rem;' />
                        <h6>${img.name}</h6>
                    </p>
                </li>
                `
            }).join('')}
        </ul>
        `))
    }
})();
