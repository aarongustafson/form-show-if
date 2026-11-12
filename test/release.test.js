import { execFileSync } from 'node:child_process';
import {
	copyFileSync,
	mkdtempSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { it, expect } from 'vitest';

it('retains publishing scripts and updates displayed and executed ESM pins', () => {
	const source = join(dirname(fileURLToPath(import.meta.url)), '..');
	const root = mkdtempSync(join(tmpdir(), 'form-show-if-version-'));
	try {
		mkdirSync(join(root, 'scripts'));
		mkdirSync(join(root, 'demo'));
		const packageJSON = JSON.parse(
			readFileSync(join(source, 'package.json'), 'utf8'),
		);
		expect(packageJSON.scripts.version).toBe(
			'node scripts/update-demo-versions.js && git add demo/esm.html',
		);
		expect(packageJSON.scripts.postversion).toBe('git push --follow-tags');
		packageJSON.version = '9.8.7';
		writeFileSync(join(root, 'package.json'), JSON.stringify(packageJSON));
		copyFileSync(
			join(source, 'scripts/update-demo-versions.js'),
			join(root, 'scripts/update-demo-versions.js'),
		);
		copyFileSync(
			join(source, 'demo/esm.html'),
			join(root, 'demo/esm.html'),
		);
		execFileSync(process.execPath, ['scripts/update-demo-versions.js'], {
			cwd: root,
		});
		expect(
			readFileSync(join(root, 'demo/esm.html'), 'utf8').match(
				/form-show-if@9\.8\.7\//g,
			),
		).toHaveLength(2);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
