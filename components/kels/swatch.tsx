export = class KSwatch extends HTMLElement {
	#styled = false

	render() {
		if (!this.#styled) {
			this.style.display = 'inline-block';
			this.style.width = '1em';
			this.style.height = '1em';
			this.#styled = true;
		}
		this.style.backgroundColor = this.hasAttribute('color') ? this.getAttribute('color') : 'var(--bs-secondary)';
		if (this.hasAttribute('round')) this.classList.add(this.getAttribute('round').toLowerCase() === 'round' ? 'rounded' : `rounded-${this.getAttribute('round')}`);
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback() {
		this.render();
	}

	get observedAttributes() {
		return [ 'color', 'round' ];
	}
}