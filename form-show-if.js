export class FormShowIfElement extends HTMLElement {
	connectedCallback() {
		// Ensures Light DOM is available - use rAF for better performance
		requestAnimationFrame(() => {
			this.__$wrapper = this;
			this.__$field = this.querySelector(
				'input:not([type=submit],[type=reset],[type=image],[type=button]),select,textarea',
			);
			this.__$form = this.closest('form') || document.body;
			this.__$fields = [this.__$field];

			// Parse conditions once and cache
			const conditionsAttr = this.getAttribute('conditions');
			this.__conditions = conditionsAttr
				? conditionsAttr.split('||')
				: [];

			this.__is_shown = null;
			this.__disabledClass = this.getAttribute('disabled-class');
			this.__enabledClass = this.getAttribute('enabled-class');

			// Cache bound methods to avoid creating new functions on each call
			this.__boundCheckIfShouldShow = this.__checkIfShouldShow.bind(this);
			this.__boundHandleReset = this.__handleReset.bind(this);

			this.__init();
		});
	}

	disconnectedCallback() {
		// Clean up event listeners to prevent memory leaks
		if (
			this.__$form &&
			this.__boundCheckIfShouldShow &&
			this.__boundHandleReset
		) {
			// Only remove reset listener if we're attached to an actual form
			if (this.__$form.tagName === 'FORM') {
				this.__$form.removeEventListener(
					'reset',
					this.__boundHandleReset,
					false,
				);
			}
			this.__$form.removeEventListener(
				'change',
				this.__boundCheckIfShouldShow,
				false,
			);
			this.__$form.removeEventListener(
				'input',
				this.__boundCheckIfShouldShow,
				false,
			);
		}
	}

	__addObservers() {
		// Only add reset listener if we're attached to an actual form
		if (this.__$form.tagName === 'FORM') {
			this.__$form.addEventListener(
				'reset',
				this.__boundHandleReset,
				false,
			);
		}
		this.__$form.addEventListener(
			'change',
			this.__boundCheckIfShouldShow,
			false,
		);
		this.__$form.addEventListener(
			'input',
			this.__boundCheckIfShouldShow,
			false,
		);
	}

	__handleReset() {
		// Use requestAnimationFrame for better performance than setTimeout
		requestAnimationFrame(() => {
			this.__checkIfShouldShow();
		});
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
		if ($fields.length > 1) {
			this.__$fields = Array.from($fields);
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
		// Early return if already shown
		if (this.__is_shown === true) {
			return;
		}
		this.__is_shown = true;
		// Wrapper changes
		if (!this.__disabledClass) {
			this.__$wrapper.removeAttribute('hidden');
		}
		this.__toggleClasses();
		// Enable field submission
		this.__$fields.forEach(($field) => {
			$field.disabled = false;
		});
	}
	__hideField() {
		// Early return if already hidden
		if (this.__is_shown === false) {
			return;
		}
		this.__is_shown = false;
		// Wrapper changes
		if (!this.__disabledClass) {
			this.__$wrapper.hidden = true;
		}
		this.__toggleClasses();
		// Disable field submission
		this.__$fields.forEach(($field) => {
			$field.disabled = true;
		});
	}

	__checkIfShouldShow() {
		let should_show = false;
		// Use cached conditions array directly
		for (let i = 0; i < this.__conditions.length; i++) {
			const condition = this.__conditions[i];
			const [name, value] = condition.split('=');

			// Try form.elements first, fall back to querySelectorAll for non-form contexts
			let $field = this.__$form.elements
				? this.__$form.elements[name]
				: null;
			if (!$field) {
				// For non-form contexts, get all elements with this name
				$field = this.__$form.querySelectorAll(`[name="${name}"]`);
				if ($field.length === 0) {
					continue;
				}
			}
			if (!$field) {
				continue;
			}

			const current_value = FormShowIfElement.__getCurrentValue($field);
			if (FormShowIfElement.__valuesMatch(value, current_value)) {
				should_show = true;
				break;
			}
		}

		// Early returns in show/hide methods prevent redundant work
		if (should_show) {
			this.__showField();
		} else {
			this.__hideField();
		}
	}

	__init() {
		this.__determineWrapper();
		this.__gatherSiblingFields();
		this.__addObservers();
		this.__checkIfShouldShow();
	}

	static __getCurrentValue($field) {
		// Handle NodeList from querySelectorAll (non-form context)
		if ($field instanceof NodeList) {
			// Check if it's a checkbox or radio group
			if ($field[0] && $field[0].type === 'checkbox') {
				const value = [];
				for (let i = 0; i < $field.length; i++) {
					if ($field[i].checked) {
						value.push($field[i].value);
					}
				}
				return value;
			}
			// For radio buttons, find the checked one
			if ($field[0] && $field[0].type === 'radio') {
				for (let i = 0; i < $field.length; i++) {
					if ($field[i].checked) {
						return $field[i].value;
					}
				}
				return '';
			}
			// For other types, just use the first element
			return $field[0] ? $field[0].value : '';
		}

		// Single checkbox
		if ($field.type === 'checkbox' && !$field.length) {
			// Only return the value if the checkbox is actually checked
			if ($field.checked) {
				// Return the value, defaulting to "on" if not explicitly set
				return $field.value || 'on';
			}
			return '';
		}

		// Checkbox array (multiple checkboxes with same name) from form.elements
		if ($field.length && $field[0].type && $field[0].type == 'checkbox') {
			const value = [];
			for (let i = 0; i < $field.length; i++) {
				if ($field[i].checked) {
					value.push($field[i].value);
				}
			}
			return value;
		}

		// Radio buttons and other inputs
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
}
