
import { emitKeypressEvents } from 'node:readline';
import type { Image } from '../types';
import api from './redditApi';

export default async function reddit1(): Promise<Image[]> {
	const [code, data] = await api.get('/api/info', {
		id: 't3_h0kpkd'
	});

	if (code < 200 || code > 299)// Non OK-like code
		throw new Error(code.toString + ': ' + JSON.stringify(data));

	const text = (data?.data?.children?.[0]?.data?.selftext as string | undefined)
		?.replace(/\\n/g, '\n')
		?.replace(/&amp;/g, '&')
		?.replace(/&lt;/g, '<')
		?.replace(/&gt;/g, '>')
		?.replace(/\n+/g, '\n')
		?? (() => {
			throw new Error();
		})();

	const lines = text.split(/\n/);

	//          Day 1: [The Acidified Temple](https://www.reddit.com/r/stevenuniverse/comments/gr7jjo/uploading_a_background_every_day_until_i_run_out/), Steven Universe The Movie \[MOV\]
	const re = /Day (\d+): \[(.*)\]\((.*)\), (.+)/;

	const epre = /(.*) \\?\[s(\w+)e(\d+)\\?\]/i;

	const urlre = /https?:\/\/(?:www\.)?reddit\.com\/r\/stevenuniverse\/comments\/(.*)\/\w+\/?/i;

	const textre = /[\s\S]*https?:\/\/preview\.redd\.it\/(.+)\.(\w+)\?width[\s\S]*/;

	const dl = lines.slice(6).slice(0, 100);

	const deepestLayer = await Promise.all(dl.map(async line => {
		const ps = re.exec(line);
		const day = +ps[1];
		const name = ps[2];
		const url = ps[3];

		let k: RegExpExecArray | null;
		const out = {
			imageUrl: null,
			sourceUrl: url,
			category: 'The Deepest Layer',
			name,
			...(ps[4].includes('\\[MOV\\]') || ps[4].includes('[MOV]') ? {
				source: 'movie'
			} : (k = epre.exec(ps[4])) === null ? {
				source: ['other', ps[4]]
			} : {
				source: [Object.is(parseInt(k[2]), NaN) || +k[2] == 6 ? 'f' : (+k[2] as 1 | 2 | 3 | 4 | 5), +k[3], k[1]]
			}),
			description: `Uploading a wallpaper every day, day ${day}`
		} as Image;

		const i = urlre.exec(url);
		const [icode, idata] = await api.get('/api/info', {
			id: 't3_' + i[1]
		});
		out.imageUrl = idata.data.children[0].data.url == url ? (() => {
			const j = textre.exec(idata.data.children[0].data.selftext);
			const jfile = j[1], jext = j[2];
			return `https://i.redd.it/${jfile}.${jext}`;
		 })() : idata.data.children[0].data.url;

		return out;
	}));

	const bf = lines.slice(6).slice(100).slice(3).slice(0, 50);

	const beyondForeground = await Promise.all(bf.map(async line => {
		const ps = re.exec(line);
		const day = +ps[1];
		const name = ps[2];
		const url = ps[3];

		let k: RegExpExecArray | null;
		const out = {
			imageUrl: null,
			sourceUrl: url,
			category: 'Beyond the Foreground',
			name,
			...(ps[4].includes('\\[MOV\\]') || ps[4].includes('[MOV]') ? {
				source: 'movie'
			} : (k = epre.exec(ps[4])) === null ? {
				source: ['other', ps[4]]
			} : {
				source: [Object.is(parseInt(k[2]), NaN) || +k[2] == 6 ? 'f' : (+k[2] as 1 | 2 | 3 | 4 | 5), +k[3], k[1]]
			}),
			description: `Uploading a wallpaper every day, day ${day}`
		} as Image;

		const i = urlre.exec(url);
		const [icode, idata] = await api.get('/api/info', {
			id: 't3_' + i[1]
		});
		out.imageUrl = idata.data.children[0].data.url == url ? (() => {
			const j = textre.exec(idata.data.children[0].data.selftext);
			const jfile = j[1], jext = j[2];
			return `https://i.redd.it/${jfile}.${jext}`;
		 })() : idata.data.children[0].data.url;

		return out;
	}));

	return [
		...deepestLayer,
		...beyondForeground
	];
}

export async function tagged(): Promise<Record<string, Image[]>> {
    const all = await reddit1();

    const filtered = (name: string) => all.filter(x => x.name.toLowerCase().includes(name.toLowerCase()));

    const beachCity = filtered('Beach City');
    const space = [...filtered('Space'), ...filtered('Galaxy'), ...filtered('Moon')];
    const temple = filtered('Temple');

    return {
        Temple: temple,
        Space: space,
        'Beach City': beachCity,
    }
}
