export class FormShowIfElement extends HTMLElement {
	connectedCallback() {
		// Ensures Light DOM is available
		setTimeout(() => {
			this.__$wrapper = this;
			this.__$field = this.querySelector(
				'input:not([type=submit],[type=reset],[type=image],[type=button]),select,textarea',
			);
			this.__$form = this.closest('form');
			this.__$fields = [this.__$field];

			this.__conditions = this.getAttribute('conditions').split('||');

			this.__is_shown = null;
			this.__disabledClass = this.getAttribute('disabled-class');
			this.__enabledClass = this.getAttribute('enabled-class');

			this.__init();
		});
	}

	__addObservers() {
		const reset = () => {
			setTimeout(this.__checkIfShouldShow.bind(this), 100);
		};
		this.__$form.addEventListener('reset', reset.bind(this), false);
		this.__$form.addEventListener(
			'change',
			this.__checkIfShouldShow.bind(this),
			false,
		);
		this.__$form.addEventListener(
			'input',
			this.__checkIfShouldShow.bind(this),
			false,
		);
	}

	__determineWrapper() {
		let $wrapper = this.__$field.parentElement;
		while ($wrapper.querySelector('label') === null) {
			if ($wrapper === this) {
				break;
			}
			$wrapper = $wrapper.parentElement;
		}
		this.__$wrapper = $wrapper;
	}

	__gatherSiblingFields() {
		const $fields = this.querySelectorAll(`[name="${this.__$field.name}"]`);
		if ($fields.length) {
			this.__$fields = [...this.__$fields, $fields];
		}
	}

	// Wrapper `class` Management
	__toggleEnabledClass() {
		if (!this.__enabledClass) {
			return;
		}
		if (this.__is_shown) {
			this.__$wrapper.classList.add(this.__enabledClass);
		} else {
			this.__$wrapper.classList.remove(this.__enabledClass);
		}
	}
	__toggleDisabledClass() {
		if (!this.__disabledClass) {
			return;
		}
		if (!this.__is_shown) {
			this.__$wrapper.classList.add(this.__disabledClass);
		} else {
			this.__$wrapper.classList.remove(this.__disabledClass);
		}
	}
	__toggleClasses() {
		this.__toggleEnabledClass();
		this.__toggleDisabledClass();
	}

	// Show / Hide Logic
	__showField() {
		this.__is_shown = true;
		// Wrapper changes
		if (!this.__disabledClass) {
			this.__$wrapper.removeAttribute('hidden');
		}
		this.__toggleClasses();
		// Disable field submission
		this.__$fields.forEach(($field) => {
			$field.disabled = false;
		});
	}
	__hideField() {
		this.__is_shown = false;
		// Wrapper changes
		if (!this.__disabledClass) {
			this.__$wrapper.hidden = true;
		}
		this.__toggleClasses();
		// Enable field submission
		this.__$fields.forEach(($field) => {
			$field.disabled = true;
		});
	}

	static __getCurrentValue($field) {
		// Checkboxes are special
		if ($field.length && $field[0].type && $field[0].type == 'checkbox') {
			let value = [];
			let length = $field.length;
			while (length--) {
				let $current_field = $field[length];
				if ($current_field.checked) {
					value.push($current_field.value);
				}
			}
			value.reverse();
			return value;
		}
		return $field.value;
	}

	static __valuesMatch(condition_value, current_value) {
		let match = false;

		// precise match
		if (condition_value == current_value) {
			match = true;
		} else if (condition_value == '*' && current_value != '') {
			// Anything
			match = true;
		} else if (
			current_value instanceof Array &&
			current_value.includes(condition_value)
		) {
			// Checkboxes
			match = true;
		}

		return match;
	}

	__checkIfShouldShow() {
		let should_show = false;
		let test_conditions = this.__conditions;
		test_conditions.some((condition) => {
			const [name, value] = condition.split('=');

			const $field = this.__$form.elements[name];
			if (!$field) {
				return;
			}

			const current_value = this.__getCurrentValue($field);
			if (this.__valuesMatch(value, current_value)) {
				should_show = true;
				return true;
			}

			return false;
		});

		if (should_show && this.__is_shown !== true) {
			this.__showField();
		} else if (!should_show && this.__is_shown !== false) {
			this.__hideField();
		}
	}

	__init() {
		this.__determineWrapper();
		this.__gatherSiblingFields();
		this.__addObservers();
		this.__checkIfShouldShow();
	}
}

if (!!customElements) {
	customElements.define('form-show-if', FormShowIfElement);
}
