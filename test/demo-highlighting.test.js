import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const name = 'form-show-if';
const hashes = {
	'esm.html':
		'163c7243818a582380bc04dd8a07630a4ec9e0b51d55aa848eadfdbeffaa5d10',
	'index.html':
		'eb1708be7b3228f250c6e604ade5d979fdae2b7d4cfd6c948401d8100b33088d',
	'unpkg.html':
		'ef21b1a44bf42d0493cb64eb37f33e0b5cc60f3a06e2b5f9e8e55b8b6e51ea55',
};

function normalizedCode(file, text) {
	if (file !== 'esm.html') return text;
	return text.replace(
		new RegExp(
			'(https://esm[.]sh/@aarongustafson/form-show-if@)[0-9]+[.][0-9]+[.][0-9]+(?:-[0-9A-Za-z.-]+)?(?:[+][0-9A-Za-z.-]+)?(?=/)',
			'g',
		),
		'$1<version>',
	);
}

function verifyDemo(source, file) {
	const template = document.createElement('template');
	template.innerHTML = source;
	const blocks = [...template.content.querySelectorAll('pre code')];
	const text = blocks.map((code) => code.textContent).join('\n');
	expect(
		createHash('sha256').update(normalizedCode(file, text)).digest('hex'),
	).toBe(hashes[file]);
	expect(template.content.querySelector('mark mark')).toBeNull();
	for (const code of blocks) {
		const marks = [...code.querySelectorAll('mark')].map(
			(mark) => mark.textContent,
		);
		const snippets = [
			...code.textContent.matchAll(
				new RegExp(`<\\/?${name}\\b[^>]*>`, 'g'),
			),
			...code.textContent.matchAll(/import\s[\s\S]*?;/g),
			...code.textContent.matchAll(
				/(?:customElements\.(?:get|define)\([\s\S]*?\)|define[A-Z]\w*\(\))/g,
			),
		];
		for (const [snippet] of snippets) {
			expect(
				marks.some((mark) => mark.includes(snippet)),
				`${file}: ${snippet}`,
			).toBe(true);
		}
	}
}

describe('displayed component code', () => {
	for (const file of Object.keys(hashes)) {
		it(`highlights component snippets without changing code in ${file}`, () => {
			verifyDemo(readFileSync(`demo/${file}`, 'utf8'), file);
		});
	}

	it('allows the publishing helper to update CDN versions without changing other displayed code', () => {
		const fixture = `test/.demo-highlighting-release-${randomUUID()}`;
		mkdirSync(`${fixture}/scripts`, { recursive: true });
		mkdirSync(`${fixture}/demo`);
		try {
			writeFileSync(
				`${fixture}/package.json`,
				JSON.stringify({
					name: `@aarongustafson/${name}`,
					type: 'module',
					version: '9.8.7',
				}),
			);
			writeFileSync(
				`${fixture}/scripts/update-demo-versions.js`,
				readFileSync('scripts/update-demo-versions.js'),
			);
			writeFileSync(
				`${fixture}/demo/esm.html`,
				readFileSync('demo/esm.html'),
			);
			execFileSync(process.execPath, [
				`${fixture}/scripts/update-demo-versions.js`,
			]);
			const updated = readFileSync(`${fixture}/demo/esm.html`, 'utf8');
			expect(updated).toContain(`@aarongustafson/${name}@9.8.7/`);
			verifyDemo(updated, 'esm.html');
			expect(() =>
				verifyDemo(
					updated.replace(/(<pre[^>]*><code[^>]*>)/, '$1changed'),
					'esm.html',
				),
			).toThrow();
			const url = `https://esm.sh/@aarongustafson/${name}@9.8.7/define.js`;
			expect(normalizedCode('esm.html', url)).toBe(
				url.replace('@9.8.7/', '@<version>/'),
			);
			expect(normalizedCode('unpkg.html', url)).toBe(url);
			expect(
				normalizedCode(
					'esm.html',
					url.replace('esm.sh', 'other.invalid'),
				),
			).toBe(url.replace('esm.sh', 'other.invalid'));
		} finally {
			rmSync(fixture, { recursive: true, force: true });
		}
	});
});
