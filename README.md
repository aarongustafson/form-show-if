# Required If Web Component

Currently, HTML provides no mechanism to show & hide dependent fields. Sometimes you only want a field to show when certain other fields have a (particular) value. The `form-show-if` web component enables that.

## API

<ul>
  <li><code>conditions</code><br> A double pipe (||) separated list of <code>name</code>/<code>value</code> pairs. When fields with the provided <code>name</code> values are updated, the value of those fields will be compared against the values you provided (or * for anything). If any resolve to true, the field will become required, otherwise it won’t be.</li>
  <li><code>disabled-class</code> (optional)<br> By default the field & <code>label</code> wrapper will be marked <code>hidden</code> when disabled, but if you can apply a custom <code>class</code> to be used instead, when the field is disabled.</li>
  <li><code>enabled-class</code> (optional)<br> By default the field & <code>label</code> wrapper will not be <code>hidden</code> when enabled, but you can apply a custom <code>class</code> to the wrapper, when the field is enabled.</li>
</ul>

## Markup Assumptions

This web component assumes the fields you reference in `conditions` exist in the DOM when the component is loaded. If they don’t, they will be ignored.

## Implementation notes

1. **Field markup changes.** When the field is in its hidden state, the wrapper — the nearest mutual parent of the field & its label, or the `form-show-if` element itself — will be `hidden` and any fields within the wrapper will be `disabled`.
1. If you provide `disabled-class` or `enabled-class` attributes, those classes will be applied to the wrapper when the field is disabled or enabled, respectively, instead of using the `hidden` attribute.

## Example

```html
<form-show-if conditions="email=*" disabled-class="hidden">
  <label>Required if there’s an email value
    <input type="text" name="depends-on-email-or-test">
  </label>
</form-show-if>
```

## Demo

[Live Demo](https://aarongustafson.github.io/form-show-if/demo.html) ([Source](./demo.html))
