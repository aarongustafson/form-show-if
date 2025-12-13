export class FormShowIfElement extends HTMLElement {
	conditions: string | null;
	enabledClass: string | null;
	disabledClass: string | null;
}

declare global {
	interface HTMLElementTagNameMap {
		'form-show-if': FormShowIfElement;
	}
}
