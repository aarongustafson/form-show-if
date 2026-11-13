import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { parsers } from 'prettier/plugins/markdown';
import { FormShowIfElement } from '../form-show-if.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

it('keeps the complete OR example and explanation in a four-column API table', async () => {
	const ast = await parsers.markdown.parse(await read('../README.md'), {});
	const table = ast.children.find((node) => node.type === 'table');
	expect(table).toBeDefined();
	expect(table.children).toHaveLength(4);
	for (const row of table.children) expect(row.children).toHaveLength(4);
	const behavior = table.children[1].children[3];
	expect(behavior.children).toContainEqual(
		expect.objectContaining({
			type: 'inlineCode',
			value: 'email=*||choose=3',
		}),
	);
	expect(
		behavior.children.some(
			(node) =>
				node.type === 'text' &&
				node.value.includes('managed fields are disabled'),
		),
	).toBe(true);
});

it('describes the real reflected attributes and properties', async () => {
	const manifest = JSON.parse(await read('../custom-elements.json'));
	const declaration = manifest.modules.find(
		(module) => module.path === 'form-show-if.js',
	).declarations[0];
	expect(declaration.attributes.map((attribute) => attribute.name)).toEqual(
		FormShowIfElement.observedAttributes,
	);
	const types = await read('../form-show-if.d.ts');
	for (const [attribute, property] of [
		['conditions', 'conditions'],
		['disabled-class', 'disabledClass'],
		['enabled-class', 'enabledClass'],
	]) {
		expect(
			declaration.attributes.find((entry) => entry.name === attribute)
				.fieldName,
		).toBe(property);
		expect(
			declaration.members.find((entry) => entry.name === property).type
				.text,
		).toBe('string | null');
		expect(types).toContain(`${property}: string | null`);
	}
	expect(declaration.superclass.name).toBe('HTMLElement');
});

it('distinguishes class-only imports from the auto-registering definition helper', async () => {
	const manifest = JSON.parse(await read('../custom-elements.json'));
	const classModule = manifest.modules.find(
		(module) => module.path === 'form-show-if.js',
	);
	expect(classModule.exports.map((entry) => entry.kind)).not.toContain(
		'custom-element-definition',
	);
	const helper = manifest.modules.find(
		(module) => module.path === 'define.js',
	);
	expect(helper?.exports.map((entry) => entry.name)).toContain(
		'defineFormShowIf',
	);
	expect(
		helper?.exports.find(
			(entry) => entry.kind === 'custom-element-definition',
		)?.name,
	).toBe('form-show-if');
	expect(
		manifest.modules.find((module) => module.path === 'index.js')
			?.exports[0].name,
	).toBe('FormShowIfElement');
});
