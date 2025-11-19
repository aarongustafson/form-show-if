import { beforeEach, afterEach } from 'vitest';
import { FormShowIfElement } from '../form-show-if.js';

// Register the custom element
if (!customElements.get('form-show-if')) {
	customElements.define('form-show-if', FormShowIfElement);
}

// Clean up DOM between tests
afterEach(() => {
	document.body.innerHTML = '';
});
