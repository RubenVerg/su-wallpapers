
import type { Image } from '../types';
import api from './redditApi';
import { TaggedImages } from './tags';

export default async function reddit2(): Promise<Image[]> {
	const [code, data] = await api.get('/api/info', {
		id: 't3_jqho6f'
	});

	if (code < 200 || code > 299) // Non OK-like code
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

	const bf = lines.slice(9).slice(0, 50);

	const beyondForeground = await Promise.all(bf.map(async line => {
		const ps = re.exec(line);
		const day = +ps[1];
		const name = ps[2];
		const url = ps[3];

		let k: RegExpExecArray | null;
		const out = {
			uid: `r_stevenuniverse_every_day_${day}`,
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

	const be = lines.slice(9).slice(50).slice(3).slice(0, 100);

	const beginningEnd = await Promise.all(be.map(async line => {
		const ps = re.exec(line);
		const day = +ps[1];
		const name = ps[2];
		const url = ps[3];

		let k: RegExpExecArray | null;
		const out = {
			uid: `r_stevenuniverse_every_day_${day}`,
			imageUrl: null,
			sourceUrl: url,
			category: 'The Beginning and The End',
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
		...beyondForeground,
		...beginningEnd
	];
}

export async function tagged(): Promise<TaggedImages> {
	const all = await reddit2();

	const filtered = (name: string) => all.filter(x => x.name.toLowerCase().includes(name.toLowerCase()));

	const beachCity = filtered('Beach City');
	const space = [...filtered('Space'), ...filtered('Galaxy'), ...filtered('Moon')];
	const temple = filtered('Temple');

	return {
		temple,
		space,
		beachCity,
	}
}
