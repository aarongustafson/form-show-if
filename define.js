import { FormShowIfElement } from './form-show-if.js';

export function defineFormShowIf(tagName = 'form-show-if') {
	const hasWindow = typeof window !== 'undefined';
	const registry = hasWindow ? window.customElements : undefined;

	if (!registry || typeof registry.define !== 'function') {
		return false;
	}

	if (!registry.get(tagName)) {
		registry.define(tagName, FormShowIfElement);
	}

	return true;
}

defineFormShowIf();
