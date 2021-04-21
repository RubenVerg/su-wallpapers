export type Tags = string;
export type AllTagAttrs = { [tag: string]: any };
export type TagAttrs<Tag extends Tags> = AllTagAttrs[Tag];
export type TagHTMLs<Tag extends Tags> = HTMLElement;

declare global {
	interface Window {
		jsx: ReturnType<typeof import('./jsx').default>
	}

	namespace NodeJS {
		interface Global {
			jsx: ReturnType<typeof import('./jsx').default>
		}
	}
}

export default function (document: Document, cEls: CustomElementRegistry) {
	function listener(elem: HTMLElement, name: string, listener: EventListenerOrEventListenerObject) {
		elem.addEventListener(name, listener);
		return elem;
	}

	function addChild(elem: HTMLElement, child: any) {
		if (child == null) return elem;
		else if (Array.isArray(child)) {
			for (let child_ of Array.from(child)) {
				addChild(elem, child_);
			}
		} else if (typeof child == 'string') {
			elem.appendChild(document.createTextNode(child));
		} else if (child instanceof Node) {
			elem.appendChild(child);
		} else if (typeof child == 'boolean') {
			// { condition && <element /> } === if (condition) <element /> else false
		} else {
			elem.appendChild(document.createTextNode(String(child)));
		}
		return elem;
	}

	return {
		createElement<Tag extends Tags>(tagName: Tag, attributes: TagAttrs<Tag> | null, ...children: any[]): TagHTMLs<Tag> {
			let elem: TagHTMLs<Tag>;
			if (tagName.includes('-')) {
				// custom element, but potentially never upgraded!
				elem = document.createElement(tagName) as TagHTMLs<Tag>;
			} else if ('is' in (attributes ?? {}) && cEls.get(attributes.is.trim())) {
				// custom builtin extension thing!
				elem = new (cEls.get(attributes.is.trim()))();
			} else {
				elem = document.createElement(tagName) as TagHTMLs<Tag>;
			}

			if (!attributes) attributes = {};

			for (let key in attributes) {
				const value = attributes[key];

				if (key === 'className') { // React's JSX doesn't support JS keywords as tags, so support for these is for compatibility
					elem.setAttribute('class', value);
				} else if (key.startsWith('html-')) { // same, eg <label html-for='id' />
					elem.setAttribute(key.slice(5), value);
				} else if (key.startsWith('on-')) { // <button on-click={ev => void 0} />
					listener(elem, key.slice(3), value);
				} else if (key.startsWith('@')) { // Vue-style @click === on-click
					listener(elem, key.slice(1), value);
				} else if (typeof value == 'boolean') { // <button disabled /> === <button disabled='disabled' />
					elem.setAttribute(key, key);
				} else {
					elem.setAttribute(key, value);
				}
			}

			for (let child of children) addChild(elem, child);

			return elem;
		}
	}
}