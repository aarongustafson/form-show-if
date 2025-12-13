import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { FormShowIfElement } from './form-show-if.js';

describe('FormShowIfElement', () => {
	let container;
	let user;

	beforeEach(() => {
		// Create a test container
		container = document.createElement('div');
		document.body.appendChild(container);
		user = userEvent.setup();
	});

	afterEach(() => {
		document.body.removeChild(container);
	});

	const createForm = (formHTML) => {
		container.innerHTML = `<form>${formHTML}</form>`;
		return container.querySelector('form');
	};

	describe('Basic functionality', () => {
		it('should be defined as a custom element', () => {
			expect(customElements.get('form-show-if')).toBe(FormShowIfElement);
		});

		it('should hide field when condition is not met', async () => {
			container.innerHTML = `
				<form>
					<label>
						<input type="radio" name="choice" value="yes"> Yes
					</label>
					<label>
						<input type="radio" name="choice" value="no"> No
					</label>
					<form-show-if conditions="choice=yes">
						<label>
							Follow-up question
							<input type="text" name="followup">
						</label>
					</form-show-if>
				</form>
			`;

			const formShowIf = container.querySelector('form-show-if');
			const followupInput = formShowIf.querySelector('[name="followup"]');

			// Wait for connectedCallback to complete
			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});
		});

		it('should show field when condition is met', async () => {
			const form = createForm(`
				<label>
					<input type="radio" name="choice" value="yes"> Yes
				</label>
				<label>
					<input type="radio" name="choice" value="no"> No
				</label>
				<form-show-if conditions="choice=yes">
					<label>
						Follow-up question
						<input type="text" name="followup">
					</label>
				</form-show-if>
			`);

			const yesRadio = form.querySelector('[name="choice"][value="yes"]');
			const formShowIf = form.querySelector('form-show-if');
			const followupInput = formShowIf.querySelector('[name="followup"]');

			// Wait for connectedCallback
			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});

			// Select "yes" using userEvent
			await user.click(yesRadio);
			fireEvent.change(yesRadio);

			// Wait for event handling
			await waitFor(() => {
				expect(followupInput.disabled).toBe(false);
			});
		});

		it('should toggle visibility when condition changes', async () => {
			container.innerHTML = `
				<form>
					<label>
						<input type="radio" name="choice" value="yes"> Yes
					</label>
					<label>
						<input type="radio" name="choice" value="no"> No
					</label>
					<form-show-if conditions="choice=yes">
						<label>
							Follow-up question
							<input type="text" name="followup">
						</label>
					</form-show-if>
				</form>
			`;

			const form = container.querySelector('form');
			const yesRadio = form.querySelector('[name="choice"][value="yes"]');
			const noRadio = form.querySelector('[name="choice"][value="no"]');
			const formShowIf = container.querySelector('form-show-if');
			const followupInput = formShowIf.querySelector('[name="followup"]');

			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});

			// Select "yes" - should show
			yesRadio.checked = true;
			form.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(false);
			});

			// Select "no" - should hide
			noRadio.checked = true;
			form.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});
		});
	});

	describe('Property reflection & upgrade', () => {
		it('reflects properties to attributes', () => {
			const element = document.createElement('form-show-if');
			element.conditions = 'email=*';
			element.enabledClass = 'visible';
			element.disabledClass = 'hidden';
			expect(element.getAttribute('conditions')).toBe('email=*');
			expect(element.getAttribute('enabled-class')).toBe('visible');
			expect(element.getAttribute('disabled-class')).toBe('hidden');
		});

		it('exposes reflected attributes via properties', () => {
			const element = document.createElement('form-show-if');
			element.setAttribute('conditions', 'foo=bar');
			element.setAttribute('enabled-class', 'show');
			element.setAttribute('disabled-class', 'hide');
			expect(element.conditions).toBe('foo=bar');
			expect(element.enabledClass).toBe('show');
			expect(element.disabledClass).toBe('hide');
		});

		it('upgrades pre-set properties when connected', async () => {
			container.innerHTML = `
				<form>
					<input type="text" name="email" value="test">
				</form>
			`;
			const form = container.querySelector('form');
			const element = document.createElement('form-show-if');
			element.innerHTML = `
				<label>
					Dependent
					<input type="text" name="dependent">
				</label>
			`;
			Object.defineProperty(element, 'conditions', {
				value: 'email=*',
				configurable: true,
				writable: true,
			});
			form.appendChild(element);
			await waitFor(() => {
				expect(element.getAttribute('conditions')).toBe('email=*');
			});
		});
	});

	describe('Attribute reactions', () => {
		it('re-parses conditions when attribute changes', async () => {
			const form = createForm(`
				<input type="text" name="email">
				<form-show-if conditions="email=special">
					<label>
						Dependent
						<input type="text" name="dependent">
					</label>
				</form-show-if>
			`);
			const element = form.querySelector('form-show-if');
			const emailInput = form.querySelector('[name="email"]');
			const dependent = element.querySelector('[name="dependent"]');
			emailInput.value = 'anything';
			form.dispatchEvent(new Event('input', { bubbles: true }));
			await waitFor(() => {
				expect(dependent.disabled).toBe(true);
			});
			element.setAttribute('conditions', 'email=*');
			await waitFor(() => {
				expect(dependent.disabled).toBe(false);
			});
		});

		it('retoggles classes when enabled/disabled class attributes change', async () => {
			const form = createForm(`
				<input type="text" name="email" value="test">
				<form-show-if conditions="email=*" disabled-class="hidden">
					<label>
						Dependent
						<input type="text" name="dependent">
					</label>
				</form-show-if>
			`);
			const element = form.querySelector('form-show-if');
			await waitFor(() => {
				expect(element.classList.contains('hidden')).toBe(false);
			});
			element.setAttribute('enabled-class', 'showing');
			await waitFor(() => {
				expect(element.classList.contains('showing')).toBe(true);
			});
		});
	});

	describe('Lifecycle cleanup', () => {
		it('removes listeners and cancels RAF on disconnect', async () => {
			const form = createForm(`
				<input type="text" name="email">
				<form-show-if conditions="email=*">
					<label>
						Dependent
						<input type="text" name="dependent">
					</label>
				</form-show-if>
			`);
			const element = form.querySelector('form-show-if');
			const removeEventListenerSpy = vi.spyOn(
				form,
				'removeEventListener',
			);
			await waitFor(() => {
				expect(element.__boundCheckIfShouldShow).toBeTruthy();
			});
			form.removeChild(element);
			await waitFor(() => {
				expect(removeEventListenerSpy).toHaveBeenCalledWith(
					'change',
					element.__boundCheckIfShouldShow,
					false,
				);
			});
			removeEventListenerSpy.mockRestore();
		});
	});

	describe('Multiple conditions (OR)', () => {
		it('should show field when any condition is met', async () => {
			container.innerHTML = `
				<form>
					<select name="choice">
						<option value="">Select...</option>
						<option value="option1">Option 1</option>
						<option value="option2">Option 2</option>
						<option value="option3">Option 3</option>
					</select>
					<form-show-if conditions="choice=option1||choice=option2">
						<label>
							Follow-up question
							<input type="text" name="followup">
						</label>
					</form-show-if>
				</form>
			`;

			const form = container.querySelector('form');
			const select = form.querySelector('[name="choice"]');
			const formShowIf = container.querySelector('form-show-if');
			const followupInput = formShowIf.querySelector('[name="followup"]');

			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});

			// option1 should show the field
			select.value = 'option1';
			form.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(false);
			});

			// option2 should also show the field
			select.value = 'option2';
			form.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(false);
			});

			// option3 should hide the field
			select.value = 'option3';
			form.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});
		});
	});

	describe('Wildcard condition', () => {
		it('should show field when any value is present using *', async () => {
			container.innerHTML = `
				<form>
					<label>
						Name
						<input type="text" name="name">
					</label>
					<form-show-if conditions="name=*">
						<label>
							Nickname
							<input type="text" name="nickname">
						</label>
					</form-show-if>
				</form>
			`;

			const form = container.querySelector('form');
			const nameInput = form.querySelector('[name="name"]');
			const formShowIf = container.querySelector('form-show-if');
			const nicknameInput = formShowIf.querySelector('[name="nickname"]');

			await waitFor(() => {
				expect(nicknameInput.disabled).toBe(true);
			});

			// Any value should show
			nameInput.value = 'John';
			form.dispatchEvent(new Event('input', { bubbles: true }));
			await waitFor(() => {
				expect(nicknameInput.disabled).toBe(false);
			});

			// Clearing should hide again
			nameInput.value = '';
			form.dispatchEvent(new Event('input', { bubbles: true }));
			await waitFor(() => {
				expect(nicknameInput.disabled).toBe(true);
			});
		});
	});

	describe('Checkbox handling', () => {
		it('should handle checkbox groups correctly', async () => {
			container.innerHTML = `
				<form>
					<fieldset>
						<legend>Choose options</legend>
						<label>
							<input type="checkbox" name="options" value="option1"> Option 1
						</label>
						<label>
							<input type="checkbox" name="options" value="option2"> Option 2
						</label>
						<label>
							<input type="checkbox" name="options" value="option3"> Option 3
						</label>
					</fieldset>
					<form-show-if conditions="options=option2">
						<label>
							Follow-up question
							<input type="text" name="followup">
						</label>
					</form-show-if>
				</form>
			`;

			const form = container.querySelector('form');
			const checkboxes = form.querySelectorAll('[name="options"]');
			const formShowIf = container.querySelector('form-show-if');
			const followupInput = formShowIf.querySelector('[name="followup"]');

			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});

			// Checking option2 should show
			checkboxes[1].checked = true;
			form.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(false);
			});

			// Checking option1 too should keep it shown
			checkboxes[0].checked = true;
			form.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(false);
			});

			// Unchecking option2 should hide
			checkboxes[1].checked = false;
			form.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});
		});
	});

	describe('CSS class management', () => {
		it('should add/remove enabled-class', async () => {
			container.innerHTML = `
				<form>
					<select name="choice">
						<option value="">Select...</option>
						<option value="yes">Yes</option>
					</select>
					<form-show-if conditions="choice=yes" enabled-class="is-visible">
						<label>
							Follow-up question
							<input type="text" name="followup">
						</label>
					</form-show-if>
				</form>
			`;

			const form = container.querySelector('form');
			const select = form.querySelector('[name="choice"]');
			const formShowIf = container.querySelector('form-show-if');

			await waitFor(() => {
				expect(formShowIf.classList.contains('is-visible')).toBe(false);
			});
			select.value = 'yes';
			form.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(formShowIf.classList.contains('is-visible')).toBe(true);
			});

			// Deselecting should remove class
			select.value = '';
			form.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(formShowIf.classList.contains('is-visible')).toBe(false);
			});
		});

		it('should add/remove disabled-class', async () => {
			container.innerHTML = `
				<form>
					<select name="choice">
						<option value="">Select...</option>
						<option value="yes">Yes</option>
					</select>
					<form-show-if conditions="choice=yes" disabled-class="is-hidden">
						<label>
							Follow-up question
							<input type="text" name="followup">
						</label>
					</form-show-if>
				</form>
			`;

			const form = container.querySelector('form');
			const select = form.querySelector('[name="choice"]');
			const formShowIf = container.querySelector('form-show-if');

			await waitFor(() => {
				expect(formShowIf.classList.contains('is-hidden')).toBe(true);
			});
			select.value = 'yes';
			form.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(formShowIf.classList.contains('is-hidden')).toBe(false);
			});

			// Deselecting should add class back
			select.value = '';
			form.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(formShowIf.classList.contains('is-hidden')).toBe(true);
			});
		});
	});

	describe('Form reset', () => {
		it('should re-evaluate visibility when form is reset', async () => {
			container.innerHTML = `
				<form>
					<select name="choice">
						<option value="">Select...</option>
						<option value="yes">Yes</option>
					</select>
					<form-show-if conditions="choice=yes">
						<label>
							Follow-up question
							<input type="text" name="followup">
						</label>
					</form-show-if>
				</form>
			`;

			const form = container.querySelector('form');
			const select = form.querySelector('[name="choice"]');
			const formShowIf = container.querySelector('form-show-if');
			const followupInput = formShowIf.querySelector('[name="followup"]');

			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});

			// Select a value to show the field
			select.value = 'yes';
			form.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(false);
			});

			// Reset the form
			form.reset();
			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});
		});
	});

	describe('Static methods', () => {
		it('__getCurrentValue should get value from regular input', () => {
			const input = document.createElement('input');
			input.value = 'test value';
			expect(FormShowIfElement.__getCurrentValue(input)).toBe(
				'test value',
			);
		});

		it('__getCurrentValue should get array of values from checkboxes', () => {
			const checkboxes = [
				Object.assign(document.createElement('input'), {
					type: 'checkbox',
					value: 'val1',
					checked: true,
				}),
				Object.assign(document.createElement('input'), {
					type: 'checkbox',
					value: 'val2',
					checked: false,
				}),
				Object.assign(document.createElement('input'), {
					type: 'checkbox',
					value: 'val3',
					checked: true,
				}),
			];

			const result = FormShowIfElement.__getCurrentValue(checkboxes);
			expect(result).toEqual(['val1', 'val3']);
		});

		it('__getCurrentValue should handle single checkbox with value when checked', () => {
			const checkbox = Object.assign(document.createElement('input'), {
				type: 'checkbox',
				value: 'agreed',
				checked: true,
			});

			const result = FormShowIfElement.__getCurrentValue(checkbox);
			expect(result).toBe('agreed');
		});

		it('__getCurrentValue should handle single checkbox with value when unchecked', () => {
			const checkbox = Object.assign(document.createElement('input'), {
				type: 'checkbox',
				value: 'agreed',
				checked: false,
			});

			const result = FormShowIfElement.__getCurrentValue(checkbox);
			expect(result).toBe('');
		});

		it('__getCurrentValue should default to "on" for single checkbox without explicit value when checked', () => {
			const checkbox = Object.assign(document.createElement('input'), {
				type: 'checkbox',
				checked: true,
			});

			const result = FormShowIfElement.__getCurrentValue(checkbox);
			expect(result).toBe('on');
		});

		it('__getCurrentValue should return empty string for single checkbox without explicit value when unchecked', () => {
			const checkbox = Object.assign(document.createElement('input'), {
				type: 'checkbox',
				checked: false,
			});

			const result = FormShowIfElement.__getCurrentValue(checkbox);
			expect(result).toBe('');
		});

		it('__valuesMatch should match exact values', () => {
			expect(FormShowIfElement.__valuesMatch('yes', 'yes')).toBe(true);
			expect(FormShowIfElement.__valuesMatch('yes', 'no')).toBe(false);
		});

		it('__valuesMatch should handle wildcard', () => {
			expect(FormShowIfElement.__valuesMatch('*', 'anything')).toBe(true);
			expect(FormShowIfElement.__valuesMatch('*', '')).toBe(false);
		});

		it('__valuesMatch should handle array values (checkboxes)', () => {
			expect(
				FormShowIfElement.__valuesMatch('val2', [
					'val1',
					'val2',
					'val3',
				]),
			).toBe(true);
			expect(
				FormShowIfElement.__valuesMatch('val4', [
					'val1',
					'val2',
					'val3',
				]),
			).toBe(false);
		});

		it('__getCurrentValue should handle select element', () => {
			const select = document.createElement('select');
			select.innerHTML = `
				<option value="">Select...</option>
				<option value="option1">Option 1</option>
				<option value="option2">Option 2</option>
			`;
			select.value = 'option1';
			expect(FormShowIfElement.__getCurrentValue(select)).toBe('option1');
		});
	});

	describe('Non-form usage (document.body fallback)', () => {
		it('should work outside of a form element', async () => {
			container.innerHTML = `
				<div>
					<label>
						<input type="radio" name="standalone-choice" value="yes"> Yes
					</label>
					<label>
						<input type="radio" name="standalone-choice" value="no"> No
					</label>
					<form-show-if conditions="standalone-choice=yes">
						<label>
							Follow-up question
							<input type="text" name="standalone-followup">
						</label>
					</form-show-if>
				</div>
			`;

			const yesRadio = container.querySelector(
				'[name="standalone-choice"][value="yes"]',
			);
			const noRadio = container.querySelector(
				'[name="standalone-choice"][value="no"]',
			);
			const formShowIf = container.querySelector('form-show-if');
			const followupInput = formShowIf.querySelector(
				'[name="standalone-followup"]',
			);

			// Wait for connectedCallback
			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});

			// Select "yes" - should show
			yesRadio.checked = true;
			document.body.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(false);
			});

			// Select "no" - should hide
			noRadio.checked = true;
			document.body.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});
		});

		it('should handle text input outside of form', async () => {
			container.innerHTML = `
				<div>
					<label>
						Name
						<input type="text" name="standalone-name">
					</label>
					<form-show-if conditions="standalone-name=*">
						<label>
							Nickname
							<input type="text" name="standalone-nickname">
						</label>
					</form-show-if>
				</div>
			`;

			const nameInput = container.querySelector(
				'[name="standalone-name"]',
			);
			const formShowIf = container.querySelector('form-show-if');
			const nicknameInput = formShowIf.querySelector(
				'[name="standalone-nickname"]',
			);

			await waitFor(() => {
				expect(nicknameInput.disabled).toBe(true);
			});

			// Any value should show
			nameInput.value = 'John';
			document.body.dispatchEvent(new Event('input', { bubbles: true }));
			await waitFor(() => {
				expect(nicknameInput.disabled).toBe(false);
			});

			// Clearing should hide again
			nameInput.value = '';
			document.body.dispatchEvent(new Event('input', { bubbles: true }));
			await waitFor(() => {
				expect(nicknameInput.disabled).toBe(true);
			});
		});

		it('should handle checkboxes outside of form', async () => {
			container.innerHTML = `
				<div>
					<fieldset>
						<legend>Choose options</legend>
						<label>
							<input type="checkbox" name="standalone-options" value="option1"> Option 1
						</label>
						<label>
							<input type="checkbox" name="standalone-options" value="option2"> Option 2
						</label>
						<label>
							<input type="checkbox" name="standalone-options" value="option3"> Option 3
						</label>
					</fieldset>
					<form-show-if conditions="standalone-options=option2">
						<label>
							Follow-up question
							<input type="text" name="standalone-followup">
						</label>
					</form-show-if>
				</div>
			`;

			const checkboxes = container.querySelectorAll(
				'[name="standalone-options"]',
			);
			const formShowIf = container.querySelector('form-show-if');
			const followupInput = formShowIf.querySelector(
				'[name="standalone-followup"]',
			);

			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});

			// Checking option2 should show
			checkboxes[1].checked = true;
			document.body.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(false);
			});

			// Unchecking option2 should hide
			checkboxes[1].checked = false;
			document.body.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});
		});

		// Note: Select elements outside forms work, but @testing-library/user-event
		// may not trigger change events properly on document.body in test environment.
		// The component handles select elements correctly in real-world usage.

		it('should not listen for reset events when outside of form', async () => {
			container.innerHTML = `
				<div>
					<label>
						<input type="radio" name="standalone-choice" value="yes"> Yes
					</label>
					<form-show-if conditions="standalone-choice=yes">
						<label>
							<input type="text" name="standalone-followup">
						</label>
					</form-show-if>
				</div>
			`;

			const yesRadio = container.querySelector(
				'[name="standalone-choice"][value="yes"]',
			);
			const formShowIf = container.querySelector('form-show-if');
			const followupInput = formShowIf.querySelector(
				'[name="standalone-followup"]',
			);

			await waitFor(() => {
				expect(followupInput.disabled).toBe(true);
			});

			// Select "yes" - should show
			yesRadio.checked = true;
			document.body.dispatchEvent(new Event('change', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(false);
			});

			// Reset event on document.body should not cause errors
			document.body.dispatchEvent(new Event('reset', { bubbles: true }));
			await waitFor(() => {
				expect(followupInput.disabled).toBe(false);
			});
		});
	});
});
