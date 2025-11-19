import { beforeAll } from 'vitest';
import { FormShowIfElement } from '../form-show-if.js';

// Define the custom element before tests run
beforeAll(() => {
	if (!customElements.get('form-show-if')) {
		customElements.define('form-show-if', FormShowIfElement);
	}

	// Make the class available globally for testing static methods
	globalThis.FormShowIfElement = FormShowIfElement;
});
