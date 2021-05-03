import r1, { tagged as rT1 } from './reddit1';
import r2, { tagged as rT2 } from './reddit2';
import r3, { tagged as rT3 } from './reddit3';
import rt, { tagged as rTt } from './reddit3';
import { TaggedImages, TagID } from './tags';

export async function all() {
	return [
		...await r1(),
		...await r2(),
		...await r3(),
		...await rt(),
	];
}

export async function tagged() {
	return {
		...await rT1(),
		...await rT2(),
		...await rT3(),
		...await rTt(),
	}
}

export async function tags(...tags: TagID[]) {
	return [...Object.entries(await tagged())].filter(([tag]) => (tags as string[]).includes(tag)).reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {} as Partial<TaggedImages>)
}