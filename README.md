# Show If Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/form-show-if.svg)](https://www.npmjs.com/package/@aarongustafson/form-show-if) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/form-show-if/ci.yml?branch=main)](https://github.com/aarongustafson/form-show-if/actions)

`form-show-if` shows or hides native form fields according to other fields’ values.
It uses light DOM, native `hidden` and `disabled` behavior, and authored labels.
Before enhancement, the fields remain available unless your markup or CSS hides them.

## TypeScript Support

- Ships with bundled `.d.ts` definitions so editors and TypeScript builds fully understand `FormShowIfElement`.
- The package export map exposes the types automatically; no extra configuration is required to consume them in TS projects.
- `HTMLElementTagNameMap` is augmented so `form-show-if` elements are correctly typed when using JSX/TSX or querying via `document.querySelector`.

## Demo

- [Live Demo](https://aarongustafson.github.io/form-show-if/demo/) ([Source](./demo/index.html))
- [ESM Demo](https://aarongustafson.github.io/form-show-if/demo/esm.html) ([Source](./demo/esm.html))
- [unpkg Demo](https://aarongustafson.github.io/form-show-if/demo/unpkg.html) ([Source](./demo/unpkg.html))

## Installation

```bash
npm install @aarongustafson/form-show-if
```

## Usage

### Option 1: Import the class and define manually

Import the class and define the custom element with your preferred tag name:

```javascript
import { FormShowIfElement } from '@aarongustafson/form-show-if';

// Define with default name
customElements.define('form-show-if', FormShowIfElement);

// Or define with a custom name
customElements.define('my-conditional-field', FormShowIfElement);
```

### Option 2: Auto-define the custom element (browser environments only)

Use the guarded definition helper to register the element when `customElements` is available:

```javascript
import '@aarongustafson/form-show-if/define.js';
```

Importing `define.js` registers the default name immediately when a browser
registry is available, even when you import the helper by name. You can also call
the helper again; it preserves an existing registration:

```javascript
import { defineFormShowIf } from '@aarongustafson/form-show-if/define.js';

defineFormShowIf();
```

You can also include the guarded script from HTML:

```html
<script
	src="./node_modules/@aarongustafson/form-show-if/define.js"
	type="module"
></script>
```

### CDN Usage

You can also use the component directly from a CDN:

```html
<script
	src="https://unpkg.com/@aarongustafson/form-show-if@latest/define.js"
	type="module"
></script>
```

## API

| Attribute        | Property        | Default | Behavior                                                                                                                                                               |
| ---------------- | --------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `conditions`     | `conditions`    | `null`  | OR-separated `name=value` comparisons, such as `email=*                                                                                                                |     | choose=3`. `*` matches a nonempty value. With no match, the managed fields are disabled. |
| `disabled-class` | `disabledClass` | `null`  | A single class token applied to the unavailable wrapper **instead of** setting `hidden`. The fields remain natively disabled; visibility is your CSS’s responsibility. |
| `enabled-class`  | `enabledClass`  | `null`  | A single class token applied to the available wrapper. Alone, this does **not** replace native hiding when unavailable.                                                |

These string properties reflect their attributes. Setting a property to `null`
removes the attribute. Native `input`, `change`, and form `reset` events trigger
reevaluation; changing a configuration attribute also updates an initialized
component. The component does not emit custom events.

Conditions support OR, not AND. Names and values cannot contain the `||` or `=`
delimiters; there is no escaping syntax. Comparisons use current values, not the
referenced control’s enabled state. A disabled controller can retain a value that
still matches. Prefer direct dependencies on an available controller instead of
assuming that hiding one dependent field will disable its dependents too.

## Markup Assumptions

Put each dependent field and its label inside a `form-show-if`. The component
manages the first eligible `input`, `select`, or `textarea`, plus same-name
siblings inside the component. It does not disable every differently named
descendant. Use a separate wrapper for each dependent field.

The wrapper is the nearest ancestor inside the component that contains a label,
or the component itself. Keep both the label and field inside that boundary.

Referenced controls are looked up in the nearest form, or the document body when
there is no form. Missing names do not match; a later input/change can find newly
added controls. Successful lookups are cached. If you replace a referenced node,
reconnect the component or change its conditions to clear that cache.

## Implementation notes

Initialization waits for an animation frame so authored children are available.
Unavailable managed fields are disabled and excluded from native FormData and
constraint validation; their values are not cleared. When a condition matches,
the fields are enabled and their wrapper is revealed unless `disabled-class`
delegates visibility to your styles.

`enabled-class` is added only while available; `disabled-class` is added only while
unavailable. The component does not supply either class’s styles. Disconnection
cancels pending initialization, removes delegated listeners, and clears cached
references. Reconnection reevaluates the existing fields; disconnection alone
does not undo their last `hidden` or `disabled` state.

## Examples

### Basic Usage

```html
<form>
	<label for="email">Email</label>
	<input type="email" id="email" name="email" />

	<form-show-if conditions="email=*">
		<label for="phone">Phone (shown if email provided)</label>
		<input type="tel" id="phone" name="phone" />
	</form-show-if>

	<button type="submit">Submit</button>
</form>
```

### Multiple Conditions (OR logic)

```html
<form-show-if conditions="email=*||phone=*">
	<label for="name">Name (shown if email OR phone provided)</label>
	<input type="text" id="name" name="name" />
</form-show-if>
```

### Specific Value Conditions

```html
<form-show-if conditions="contact-method=email">
	<label for="email">Email Address</label>
	<input type="email" id="email" name="email" />
</form-show-if>
```

### Checkbox Conditions

```html
<form-show-if conditions="newsletter=yes">
	<label for="email">Email (shown for newsletter)</label>
	<input type="email" id="email" name="email" />
</form-show-if>
```

### Using Custom Classes

```html
<form-show-if
	conditions="email=*"
	disabled-class="disabled"
	enabled-class="enabled"
>
	<label for="phone"
		>Phone
		<input
			type="tel"
			id="phone"
			name="phone"
			aria-describedby="phone-state"
		/>
	</label>
	<small id="phone-state">
		<span class="state-on">Available</span>
		<span class="state-off">Unavailable: enter an email above</span>
	</small>
</form-show-if>
```

The demo styles keep reading colors paired. Solid/dashed outlines and authored
availability text convey the state; green/red accents are supplementary:

```css
.enabled label,
.disabled label {
	outline: 2px solid currentColor;
	outline-offset: 0.25rem;
	background: Canvas;
	color: CanvasText;
	border-inline-start: 0.25rem solid #17652e;
	padding: 0.75rem;
}
.disabled label {
	outline-style: dashed;
	border-inline-start-color: #982b39;
}
.state-off,
.disabled .state-on {
	display: none;
}
.disabled .state-off {
	display: inline;
}
```

Translate or replace the authored labels and status text as needed. The component
generates no user-facing strings. Keeping descriptions outside labels preserves
stable accessible names; `aria-describedby` associates the current explanation.
Without enhancement, the fields remain usable and the default “Available” text
remains truthful.

## Styling and accessibility

The component injects no CSS, colors, focus ring, shadow DOM, or CSS parts.
Use normal light-DOM selectors and the optional state classes. Pair backgrounds
and foregrounds, retain readable labels and necessary boundaries, and do not rely
only on color or faded opacity to convey availability. The demos use Canvas
reading pairs, ButtonFace/ButtonText controls, and Field/FieldText inputs, with
foreground-colored necessary borders and browser-native focus. Supporting footer
text uses an 80% CanvasText/Canvas mix with a Canvas backing and full-strength
forced-color/increased-contrast fallback.

Do not override native hiding with an unconditional `form-show-if { display:
block; }`. Use `form-show-if:not([hidden])` if you need a block wrapper.

Revealing fields does not move focus. Native keyboard navigation reaches enabled
fields and skips disabled ones. If application code invalidates a focused field
programmatically, move focus to a relevant visible control before hiding or
disabling it. Custom-class availability text is not an automatic live announcement;
provide deliberate, restrained announcements if your application needs them.

Keep required instructions outside conditionally hidden wrappers. Authored fields
remain visible and usable without JavaScript or after an import failure unless
your own markup/CSS hides them. Do not pre-hide essential fields merely to avoid
the initial enhancement transition.

## Browser Support

This web component works in all modern browsers that support:

- Custom Elements v1
- ES Modules (for module usage)

For older browsers, you may need polyfills for Custom Elements.

## Development

### Testing

```bash
# Run tests
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Install browser engines once, then run real-browser checks
npx playwright install chromium firefox webkit
npm run test:browser
```

Browser tests substitute the study’s 19 distinct palettes and cover native
conditions, form submission values, reset, keyboard focus, non-color status,
reflow, and no-script/module-failure paths. Palette substitution does not
reproduce an operating system’s forced-color painting. Firefox custom colors,
real Windows Contrast themes, platform zoom, mobile hardware, and manual
assistive-technology acceptance still need testing; automated checks do not
establish conformance.

Reflow checks cover 320–1400px viewports and enlarged root text at 320px, with
measured field widths rather than only page-overflow assertions. Enlarging root
text is not a substitute for testing browser zoom.

### Linting and Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```
