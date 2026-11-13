import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const name = 'form-show-if';
const hashes = {
	'esm.html':
		'1fc82d4404083a55c6c63bc115d0fa4f979c1a66d2a9218461094232537dcefb',
	'index.html':
		'eb1708be7b3228f250c6e604ade5d979fdae2b7d4cfd6c948401d8100b33088d',
	'unpkg.html':
		'ef21b1a44bf42d0493cb64eb37f33e0b5cc60f3a06e2b5f9e8e55b8b6e51ea55',
};

describe('displayed component code', () => {
	for (const [file, hash] of Object.entries(hashes)) {
		it(`highlights component snippets without changing code in ${file}`, () => {
			const template = document.createElement('template');
			template.innerHTML = readFileSync(`demo/${file}`, 'utf8');
			const blocks = [...template.content.querySelectorAll('pre code')];
			const text = blocks.map((code) => code.textContent).join('\n');
			expect(createHash('sha256').update(text).digest('hex')).toBe(hash);
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
		});
	}
});
