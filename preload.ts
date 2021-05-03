// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

import { ipcRenderer } from 'electron';
import jsx from './jsx';
import * as els from './components';
import * as util from '@rubenverg/electron-util/safe';
import _ from 'lodash';

// @ts-ignore
window.__devtron = { require, process }

window.jsx = jsx(document, window.customElements);
window.electronUtil = util;
window._ = _;

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

process.once('loaded', () => {
	for (let elName in els) {
		if (Array.isArray(els[elName]) && els[elName].length >= 2) {
			console.log(elName, els[elName]);
			customElements.define(
				elName,
				els[elName][1],
				...(
					els[elName][0]
						? [{ extends: els[elName][0] }]
						: []
				)
			);
		}
	}

	console.log('hi');
	global.ipc = ipcRenderer;
	global.exports = {};
	global.jsx = jsx(document, customElements);
	global.electronUtil = util;
	global._ = _;
});