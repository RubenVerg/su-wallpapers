import * as bs from './bootstrap';

const upper = /(?:(?<!\p{Uppercase_Letter})\p{Uppercase_Letter}|\p{Uppercase_Letter}(?!\p{Uppercase_Letter}))/gu;
function kebabize(str: string) {
	return str.replace(upper, '-$&').replace(/^-/, '').toLowerCase();
}

const els: CustomElementConstructor[] = [
	...Object.values(bs)
];

const out: Record<string, [string | null, CustomElementConstructor]> = {

};

for (let element of els) {
	const name: string = (element as any).NAME ?? kebabize(element.name);
	out[name] = [
		'ELEMENT' in element ? (element as any).ELEMENT : null,
		element
	];
}

export = out;