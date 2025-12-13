# Show If Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/form-show-if.svg)](https://www.npmjs.com/package/@aarongustafson/form-show-if) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/form-show-if/ci.yml?branch=main)](https://github.com/aarongustafson/form-show-if/actions)

Currently, HTML provides no mechanism to show & hide dependent fields. Sometimes you only want a field to show when certain other fields have a (particular) value. The `form-show-if` web component enables that.

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

If you prefer to control when the element is registered, call the helper directly:

```javascript
import { defineFormShowIf } from '@aarongustafson/form-show-if/define.js';

defineFormShowIf();
```

You can also include the guarded script from HTML:

```html
<script src="./node_modules/@aarongustafson/form-show-if/define.js" type="module"></script>
```

### CDN Usage

You can also use the component directly from a CDN:

```html
<script src="https://unpkg.com/@aarongustafson/form-show-if@latest/define.js" type="module"></script>
```

## API

<ul>
  <li><code>conditions</code><br> A double pipe (||) separated list of <code>name</code>/<code>value</code> pairs. When fields with the provided <code>name</code> values are updated, the value of those fields will be compared against the values you provided (or * for anything). If any resolve to true, the field will be shown, otherwise it will be hidden.</li>
  <li><code>disabled-class</code> (optional)<br> By default the field & <code>label</code> wrapper will be marked <code>hidden</code> when disabled, but you can apply a custom <code>class</code> to be used instead, when the field is disabled.</li>
  <li><code>enabled-class</code> (optional)<br> By default the field & <code>label</code> wrapper will not be <code>hidden</code> when enabled, but you can apply a custom <code>class</code> to the wrapper, when the field is enabled.</li>
</ul>

## Markup Assumptions

This web component assumes the fields you reference in `conditions` exist in the DOM when the component is loaded. If they don't, they will be ignored.

## Implementation notes

The "wrapper" mentioned below refers to the nearest mutual parent of the field & its label. It may be the `form-show-if` element itself.

1. **Field markup changes.** When the field is hidden (conditions not met), it will receive the `disabled` attribute and all fields within the wrapper are disabled.

2. **Visual state management.** If `disabled-class` and/or `enabled-class` **are not** defined:
   * When **no** condition is met: The wrapper has a `hidden` attribute
   * When **any** condition is met: The `hidden` attribute is removed from the wrapper

3. **Custom class management.** If `disabled-class` and/or `enabled-class` **are** defined:
   * When **no** condition is met:
     * If `enabled-class` is defined, it is removed from the wrapper
     * If `disabled-class` is defined, it is added to the wrapper
   * When **any** condition is met:
     * If `enabled-class` is defined, it is added to the wrapper
     * If `disabled-class` is defined, it is removed from the wrapper

## Examples

### Basic Usage

```html
<form>
  <label for="email">Email</label>
  <input type="email" id="email" name="email">

  <form-show-if conditions="email=*">
    <label for="phone">Phone (shown if email provided)</label>
    <input type="tel" id="phone" name="phone">
  </form-show-if>

  <button type="submit">Submit</button>
</form>
```

### Multiple Conditions (OR logic)

```html
<form-show-if conditions="email=*||phone=*">
  <label for="name">Name (shown if email OR phone provided)</label>
  <input type="text" id="name" name="name">
</form-show-if>
```

### Specific Value Conditions

```html
<form-show-if conditions="contact-method=email">
  <label for="email">Email Address</label>
  <input type="email" id="email" name="email">
</form-show-if>
```

### Checkbox Conditions

```html
<form-show-if conditions="newsletter=yes">
  <label for="email">Email (shown for newsletter)</label>
  <input type="email" id="email" name="email">
</form-show-if>
```

### Using Custom Classes

```html
<form-show-if conditions="email=*" disabled-class="visually-hidden" enabled-class="is-visible">
  <label for="phone">Phone</label>
  <input type="tel" id="phone" name="phone">
</form-show-if>
```

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
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```
