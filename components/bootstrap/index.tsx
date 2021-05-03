import type { Alert, Button, Carousel, Collapse, Dropdown, Tab, Modal, Offcanvas, Popover, ScrollSpy, Toast, Tooltip } from 'bootstrap';

declare var bootstrap: {
	Alert: { new(el: Element): Alert },
	Button: { new(el: Element): Button },
	Carousel: { new(el: Element): Carousel },
	Collapse: { new(el: Element): Collapse },
	Dropdown: { new(el: Element): Dropdown },
	Tab: { new(el: Element): Tab },
	Modal: { new(el: Element): Modal },
	Offcanvas: { new(el: Element): Offcanvas },
	Popover: { new(el: Element): Popover },
	ScrollSpy: { new(el: Element): ScrollSpy },
	Toast: { new(el: Element): Toast },
	Tooltip: { new(el: Element): Tooltip }
};

export class BSTabSelector extends HTMLButtonElement {
	constructor() {
		super();

		window.addEventListener('fully-loaded-believe-me', () => {
			const trigger = new bootstrap.Tab(this);

			this.addEventListener('click', ev => {
				ev.preventDefault();
				trigger.show();
			});
		});
	}

	static readonly ELEMENT = 'button';
}

// <bs-alert variant='secondary' dismiss> abcd <button is='bs-alert-dismiss' /> </bs-alert>
export class BSAlert extends HTMLElement {
	connectedCallback() {
		this.setAttribute('role', 'alert');
		if (!this.style.display) this.style.display = 'block';
		this.classList.add('alert');
		if (this.hasAttribute('variant')) this.classList.add('alert-' + this.getAttribute('variant').trim());
		if (this.hasAttribute('dismiss')) {
			this.classList.add('alert-dismissable');
		}
	}
}

export class BSAlertDismiss extends HTMLButtonElement {
	connectedCallback() {
		this.setAttribute('type', 'button');
		this.classList.add('btn-close');
		this.dataset.bsDismiss = 'alert';
		if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Close');
	}

	static readonly ELEMENT = 'button';
}

// <bs-badge style='success' round>5</bs-badge>
export class BSBadge extends HTMLElement {
	connectedCallback() {
		this.classList.add('badge');
		if (this.hasAttribute('variant')) this.classList.add('bg-' + this.getAttribute('variant').trim());
		if (this.hasAttribute('variant') && [
			'warning',
			'info',
			'light',
		].includes(this.getAttribute('variant').trim().toLowerCase())) this.classList.add('text-dark');
		if (this.hasAttribute('round')) this.classList.add('rounded-pill');
	}
}

export class BSBreadcrumbParent extends HTMLElement {
	connectedCallback() {
		if (this.hasAttribute('divider')) this.style.setProperty('--bs-breadcrumb-divider', this.getAttribute('divider'))
	}

	static readonly ELEMENT = 'nav';
}

export class BSBreadcrumb extends HTMLOListElement {
	connectedCallback() {
		this.classList.add('breadcrumb');
	}

	static readonly ELEMENT = 'ol';
}

export class BSBreadcrumbItem extends HTMLOListElement {
	connectedCallback() {
		this.classList.add('breadcrumb-item');
		if (this.hasAttribute('active')) {
			this.classList.add('active');
			this.setAttribute('aria-current', 'page');
		}
	}

	static readonly ELEMENT = 'li';
}

export class BSButton extends HTMLButtonElement {
	constructor() {
		super();
		setTimeout(() => this.connectedCallback(), 0);
	}

	paint() {
		console.log('hello from <button is="bs-button">');
		this.classList.add('btn');
		if (this.hasAttribute('variant')) this.classList.add('btn-' + (this.hasAttribute('outline') ? 'outline-' : '') + this.getAttribute('variant').trim());
		if (!this.hasAttribute('type')) this.setAttribute('type', 'button');
		if (this.hasAttribute('size')) this.classList.add('btn-' + this.getAttribute('size'));
	}

	connectedCallback() {
		this.paint();
	}

	static get observedAttributes() {
		return [
			'variant',
			'size',
			'outline',
		]
	}

	attributeChangedCallback(name: string, o: string, n: string) {
		this.paint();
	}

	static readonly ELEMENT = 'button';
}

// <bs-button-group size=lg vertical><button is='bs-button' variant=warning>idk</button></bs-button-group>
export class BSButtonGroup extends HTMLElement {
	connectedCallback() {
		if (!this.style.display) this.style.display = 'block';
		this.classList.add('btn-group' + this.hasAttribute('vertical') ? '-vertical' : '');
		this.setAttribute('role', 'group');
		if (this.hasAttribute('size')) this.classList.add('btn-group-' + this.getAttribute('size'));
	}
}

// <bs-button-toolbar><bs-button-group></bs-button-group></bs-button-toolbar>
export class BSButtonToolbar extends HTMLElement {
	connectedCallback() {
		if (!this.style.display) this.style.display = 'block';
		this.classList.add('btn-toolbar');
		this.setAttribute('role', 'toolbar');
	}
}

/**
@example <card>
	<img src="..." alt="..." is='card-img' placement=top />
	<header class='card-header'>Header</header>
	<div is='card-body'>
		<h5 class='card-title'>
			Card title
		</h5>
		<p class='card-text'>
			...
		</p>
		<a href='#' class='btn btn-primary'>Do stuff</a>
	</div>
	<footer class='card-footer'>Below...</footer>
</card>
*/
export class BSCard extends HTMLElement {
	connectedCallback() {
		this.classList.add('card');
	}
}

export class BSCardImg extends HTMLImageElement {
	connectedCallback() {
		this.classList.add('card-img-' + this.getAttribute('placement')?.trim() ?? 'top');
	}

	static readonly ELEMENT = 'img';
}

export class BSCardBody extends HTMLDivElement {
	connectedCallback() {
		this.classList.add('card-body');
	}

	static readonly ELEMENT = 'div';
}

export class BSModal extends HTMLElement {
	#wrapped = false
	connectedCallback() {
		this.classList.add('modal');
		if (this.hasAttribute('noclick')) {
			this.dataset.bsBackdrop = 'static';
			this.dataset.bsKeyboard = 'false';
		}
		// setTimeout(() => {
			if (this.#wrapped) return;
			this.#wrapped = true;
			const ch = Array.from(this.childNodes);
			this.innerHTML = '';
			this.appendChild(<div class={
				[
					'modal-dialog',
					...this.hasAttribute('scroll') ? ['modal-dialog-scrollable'] : [],
					...this.hasAttribute('center') ? ['modal-dialog-centered'] : [],
					...this.hasAttribute('size') ? ['modal-' + this.getAttribute('size')] : [],
					...this.hasAttribute('fullscreen') ? (
						this.getAttribute('fullscreen') === 'fullscreen' ? ['modal-fullscreen'] : ['modal-fullscreen-' + this.getAttribute('fullscreen') + '-down']
					) : []
				].join(' ')}>
				<div class='modal-content'>
					{ch}
				</div>
			</div>);
		// }, 0);
	}
}