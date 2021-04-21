// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

import { ipcRenderer } from 'electron';
import jsx from './jsx';
import * as els from './elements';

window.jsx = jsx(document, window.customElements);

declare var bootstrap: any;

window.addEventListener('DOMContentLoaded', () => {
	const replaceText = (selector: string, text: string) => {
		const element = document.getElementById(selector);
		if (element) element.innerText = text;
	}

	for (const type of ['chrome', 'node', 'electron']) {
		replaceText(`${type}-version`, process.versions[type]);
	}
});

function kebabize(str: string) {
	// uppercase after a non-uppercase or uppercase before non-uppercase
	const upper = /(?:(?<!\p{Uppercase_Letter})\p{Uppercase_Letter}|\p{Uppercase_Letter}(?!\p{Uppercase_Letter}))/gu;
	return str.replace(upper, "-$&").replace(/^-/, "").toLowerCase();
}

process.once('loaded', () => {
	for (let element in els) {
		customElements.define(els[element].NAME ?? kebabize(element), els[element], {
			...els[element].ELEMENT && { extends: els[element].ELEMENT }
		});
	}

	console.log('hi');
	global.ipc = ipcRenderer;
	global.exports = {};
	global.jsx = jsx(document, customElements);
});