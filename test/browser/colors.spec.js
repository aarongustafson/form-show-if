import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const read = (path) =>
	readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
const source = await read('form-show-if.js');
const definition = await read('define.js');
const css = await read('demo/styles.css');
const html = await read('demo/index.html');
const readme = await read('README.md');
const tokens = [
	'Canvas',
	'CanvasText',
	'ButtonFace',
	'ButtonText',
	'Field',
	'FieldText',
];
// The study's 62 observations reduce to 19 palettes. Substitution is not OS repainting.
const palettes = [
	['#ffffff', '#000000', '#efefef', '#000000', '#ffffff', '#000000'],
	['#121212', '#ffffff', '#6b6b6b', '#ffffff', '#3b3b3b', '#ffffff'],
	['#ffffff', '#000000', '#e9e9ed', '#000000', '#ffffff', '#000000'],
	['#1c1b22', '#fbfbfe', '#2b2a33', '#fbfbfe', '#2b2a33', '#fbfbfe'],
	['#ffffff', '#000000', '#c0c0c0', '#000000d8', '#ffffff', '#000000d8'],
	['#1e1e1e', '#ffffff', '#ffffff3f', '#ffffffd8', '#ffffff3f', '#ffffffd8'],
	['#ffffff', '#000000', '#f0f0f0', '#000000', '#ffffff', '#000000'],
	['#202020', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#3d3d3d'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffee32'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#b6f6f0'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#202020'],
	['#ffffff', '#000000', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#000000', '#ffffff', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#ffffff', '#000000', '#ffffff', '#000000d8', '#ffffff', '#000000d8'],
	['#282828', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#202020', '#ffffff', '#00000000', '#ffffff', '#00000000', '#ffffff'],
];

function substitute(text, palette) {
	const colors = Object.fromEntries(
		tokens.map((token, index) => [token, palette[index]]),
	);
	return text.replace(
		/\b(CanvasText|Canvas|ButtonFace|ButtonText|FieldText|Field)\b/g,
		(token) => colors[token],
	);
}

async function measurements(locator) {
	return locator.evaluate((element) => {
		const context = document.createElement('canvas').getContext('2d');
		if (!context) throw new Error('Canvas measurement unavailable.');
		const pixel = () => [...context.getImageData(0, 0, 1, 1).data];
		const paint = (color) => {
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
			return pixel();
		};
		const background = (node) => {
			context.clearRect(0, 0, 1, 1);
			const ancestors = [];
			for (; node; node = node.parentElement) ancestors.unshift(node);
			for (const ancestor of ancestors) {
				const style = getComputedStyle(ancestor);
				if (style.opacity !== '1')
					throw new Error('Opacity requires group compositing.');
				paint(style.backgroundColor);
				if (style.backgroundImage !== 'none') {
					const wash = style.backgroundImage.match(
						/^linear-gradient\((.+), \1\)$/,
					);
					if (!wash)
						throw new Error(
							`Unsupported background: ${style.backgroundImage}`,
						);
					paint(wash[1]);
				}
			}
			if (pixel()[3] !== 255)
				throw new Error('Expected an opaque measurement surface.');
			return pixel();
		};
		const luminance = (rgb) =>
			rgb.slice(0, 3).reduce((sum, channel, index) => {
				const value = channel / 255;
				return (
					sum +
					(value <= 0.04045
						? value / 12.92
						: ((value + 0.055) / 1.055) ** 2.4) *
						[0.2126, 0.7152, 0.0722][index]
				);
			}, 0);
		const ratio = (a, b) => {
			const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
			return (values[0] + 0.05) / (values[1] + 0.05);
		};
		const style = getComputedStyle(element);
		const fill = background(element);
		const foreground = paint(style.color);
		const surround = background(element.parentElement);
		background(element);
		const border = paint(style.borderTopColor);
		const paintsBorder =
			parseFloat(style.borderTopWidth) > 0 &&
			!['none', 'hidden'].includes(style.borderTopStyle);
		return {
			text: ratio(foreground, fill),
			boundary: Math.max(
				ratio(fill, surround),
				paintsBorder ? ratio(border, surround) : 1,
			),
		};
	});
}

async function demo(page, name = 'index.html') {
	await page.route('https://esm.sh/**', (route) =>
		route.fulfill({ contentType: 'text/javascript', body: source }),
	);
	await page.route('https://unpkg.com/**', (route) =>
		route.fulfill({
			contentType: 'text/javascript',
			body: definition.replace(
				"'./form-show-if.js'",
				"'http://127.0.0.1:4180/form-show-if.js'",
			),
		}),
	);
	await page.goto(`/demo/${name}`);
	await expect(
		page.locator('form-show-if input, form-show-if select').first(),
	).toBeDisabled();
}

test('all 19 palettes preserve reading, fields, disabled-state labels and controls', async ({
	page,
}) => {
	test.setTimeout(60_000);
	await demo(page);
	const custom = html.match(/<style>([\s\S]*?)<\/style>/)[1];
	await page.locator('link[rel="stylesheet"]').evaluate((link) => {
		const style = document.createElement('style');
		style.id = 'palette-css';
		link.replaceWith(style);
	});
	for (const [index, palette] of palettes.entries()) {
		await page.locator('#palette-css').evaluate(
			(style, replacement) => {
				style.textContent = replacement;
			},
			substitute(css, palette),
		);
		await page.locator('head > style:not(#palette-css)').evaluate(
			(style, replacement) => {
				style.textContent = replacement;
			},
			substitute(custom, palette),
		);
		for (const selector of [
			'main > section > h2',
			'.demo-section',
			'.demo',
			'pre',
			'pre code mark',
			'.note',
			'.api-reference',
			'footer',
			'.disabled label',
			'.disabled small',
		]) {
			const target = page.locator(selector).first();
			expect(
				(await measurements(target)).text,
				`${index}: ${selector}`,
			).toBeGreaterThanOrEqual(4.5);
		}
		await page.locator('[name="email6"]').fill('reader@example.com');
		for (const selector of [
			'.enabled label',
			'.enabled small',
			'.enabled textarea',
			'button[type="submit"]',
			'[name="email6"]',
		]) {
			const target = page.locator(selector).first();
			const result = await measurements(target);
			expect(result.text, `${index}: ${selector}`).toBeGreaterThanOrEqual(
				4.5,
			);
			if (
				selector.includes('textarea') ||
				selector.includes('button') ||
				selector.includes('name=')
			)
				expect(result.boundary).toBeGreaterThanOrEqual(3);
		}
		const submit = page.getByRole('button', { name: 'Send', exact: true });
		await submit.hover();
		await expect(submit).toHaveCSS('opacity', '1');
		expect((await measurements(submit)).text).toBeGreaterThanOrEqual(4.5);
		await page.locator('[name="email6"]').fill('');
	}
});

for (const colorScheme of ['light', 'dark']) {
	test(`${colorScheme}: custom state labels retain reading contrast`, async ({
		page,
	}) => {
		await page.emulateMedia({ colorScheme });
		await demo(page);
		for (const selector of [
			'.disabled label',
			'.disabled small',
			'footer',
			'.demo',
			'pre',
			'pre code mark',
			'.note',
			'.api-reference',
			'[name="email6"]',
		]) {
			expect(
				(await measurements(page.locator(selector).first())).text,
				selector,
			).toBeGreaterThanOrEqual(4.5);
		}
		await page.locator('[name="email6"]').fill('reader@example.com');
		expect(
			(await measurements(page.locator('.enabled label').first())).text,
		).toBeGreaterThanOrEqual(4.5);
	});

	test(`${colorScheme}: native control pair is measured separately`, async ({
		page,
		browserName,
	}) => {
		test.fail(
			browserName === 'webkit' &&
				process.platform === 'linux' &&
				colorScheme === 'dark',
			'Bundled Linux WebKit native dark ButtonText/ButtonFace pair.',
		);
		await page.emulateMedia({ colorScheme });
		await demo(page);
		expect(
			(
				await measurements(
					page.getByRole('button', { name: 'Send', exact: true }),
				)
			).text,
		).toBeGreaterThanOrEqual(4.5);
	});
}

test('custom classes convey availability with authored text and distinct outlines', async ({
	page,
}) => {
	await demo(page);
	const host = page.locator('form-show-if[conditions="email6=*"]');
	await expect(host.locator('.state-off')).toBeVisible();
	await expect(host.locator('.state-off')).toContainText('Unavailable');
	await expect(host.locator('.state-on')).toBeHidden();
	await expect(host.locator('label')).toHaveCSS('outline-style', 'dashed');
	await expect(host.locator('textarea')).toHaveAccessibleName('Notes');
	await expect(host.locator('textarea')).toHaveAccessibleDescription(
		/Unavailable/,
	);
	await page.locator('[name="email6"]').fill('reader@example.com');
	await expect(host.locator('.state-on')).toBeVisible();
	await expect(host.locator('.state-on')).toContainText('Available');
	await expect(host.locator('.state-off')).toBeHidden();
	await expect(host.locator('label')).toHaveCSS('outline-style', 'solid');
	await expect(host.locator('textarea')).toHaveAccessibleName('Notes');
	await expect(host.locator('textarea')).toHaveAccessibleDescription(
		'Available',
	);
});

test('copyable and README state styles match the live styles', async ({
	page,
}) => {
	await demo(page);
	const live = html.match(/<style>([\s\S]*?)<\/style>/)[1];
	const copyable = (
		await page
			.locator('pre code')
			.filter({ hasText: '.disabled label' })
			.textContent()
	).match(/<style>([\s\S]*?)<\/style>/)[1];
	const documented = readme.match(/```css\n([\s\S]*?)```/)[1];
	for (const css of [copyable, documented])
		expect(css.replace(/\s+/g, '')).toBe(live.replace(/\s+/g, ''));
});

test('dependent fields use a visible controller rather than stale disabled values', async ({
	page,
}) => {
	await demo(page);
	const choice = page.locator('#feature-type');
	await expect(choice).toBeEnabled();
	await choice.selectOption('advanced');
	await page.locator('#config').fill('Retain this configuration');
	await choice.selectOption('basic');
	await expect(page.locator('#config')).toBeDisabled();
	await expect(page.locator('#config')).toBeHidden();
	await choice.selectOption('');
	await expect(page.locator('#feature-summary')).toBeDisabled();
	await choice.selectOption('advanced');
	await expect(page.locator('#config')).toHaveValue(
		'Retain this configuration',
	);
});

test('native keyboard focus stays on the controller and reaches only available fields', async ({
	page,
	browserName,
}) => {
	await demo(page);
	const controller = page.locator('[name="email"]');
	await controller.focus();
	await page.keyboard.type('reader@example.com');
	await expect(controller).toBeFocused();
	await expect(page.locator('#phone')).toBeVisible();
	await page.keyboard.press(
		browserName === 'webkit' && process.platform === 'darwin'
			? 'Alt+Tab'
			: 'Tab',
	);
	await expect(page.locator('#phone')).toBeFocused();
	await expect(page.locator('#phone')).toHaveCSS('outline-style', 'auto');
	await controller.fill('');
	await expect(page.locator('#phone')).toBeHidden();
	await page.keyboard.press(
		browserName === 'webkit' && process.platform === 'darwin'
			? 'Alt+Tab'
			: 'Tab',
	);
	await expect(page.locator('[name="email2"]')).toBeFocused();
});

test('native FormData excludes unavailable fields, retains values and resets conditions', async ({
	page,
}) => {
	await demo(page);
	const form = page.locator('.demo form').last();
	const contact = form.locator('[name="contact[]"][value="email"]');
	const email = form.locator('#contact-email');
	await expect(email).toBeDisabled();
	await contact.check();
	await email.fill('reader@example.com');
	expect(
		await form.evaluate((form) => new FormData(form).get('contact-email')),
	).toBe('reader@example.com');
	await contact.uncheck();
	await expect(email).toBeHidden();
	expect(
		await form.evaluate((form) => new FormData(form).has('contact-email')),
	).toBe(false);
	await contact.check();
	await expect(email).toHaveValue('reader@example.com');
	await form.getByRole('button', { name: 'Reset', exact: true }).click();
	await expect(email).toBeHidden();
	await expect(contact).not.toBeChecked();
});

test('OR, exact-match, radio and checkbox conditions retain native behavior', async ({
	page,
}) => {
	await demo(page);
	await page.locator('#choose').selectOption('3');
	await expect(page.locator('#details')).toBeVisible();
	await page.locator('#choose').selectOption('');
	await expect(page.locator('#details')).toBeHidden();
	await page.locator('[name="email2"]').fill('reader@example.com');
	await expect(page.locator('#details')).toBeVisible();
	await page.locator('[name="email3"]').fill('different@example.com');
	await expect(page.locator('#secret')).toBeHidden();
	await page.locator('[name="email3"]').fill('foo@bar.tld');
	await expect(page.locator('#secret')).toBeVisible();
	await page.locator('[name="radio"][value="other"]').check();
	await expect(page.locator('[name="radio-other"]')).toBeVisible();
	await page.locator('[name="radio"][value="1"]').check();
	await expect(page.locator('[name="radio-other"]')).toBeHidden();
	await page.locator('[name="checkbox[]"][value="other"]').check();
	await expect(page.locator('[name="checkbox-other"]')).toBeVisible();
	await page.locator('[name="checkbox[]"][value="other"]').uncheck();
	await expect(page.locator('[name="checkbox-other"]')).toBeHidden();
});

test('forced colors retain automatic adjustment, state text and native focus', async ({
	page,
	browserName,
}) => {
	test.skip(
		browserName !== 'chromium',
		'Forced-color emulation is Chromium-only.',
	);
	await page.emulateMedia({ forcedColors: 'active' });
	await demo(page);
	const host = page.locator('form-show-if[conditions="email6=*"]');
	await expect(host.locator('.state-off')).toBeVisible();
	await expect(host).toHaveCSS('forced-color-adjust', 'auto');
	await page.locator('[name="email6"]').focus();
	await page.keyboard.type('reader@example.com');
	await page.keyboard.press('Tab');
	await expect(host.locator('textarea')).toBeFocused();
	await expect(host.locator('textarea')).toHaveCSS('outline-style', 'auto');
	await expect(host.locator('.state-on')).toBeVisible();
});

test('increased contrast restores full-strength supporting text', async ({
	page,
}) => {
	await page.emulateMedia({ contrast: 'more' });
	await demo(page);
	const color = await page
		.locator('body')
		.evaluate((element) => getComputedStyle(element).color);
	await expect(page.locator('footer')).toHaveCSS('color', color);
});

for (const name of ['index.html', 'esm.html', 'unpkg.html']) {
	test(`${name}: code/live pairs reflow with usable fields`, async ({
		page,
	}) => {
		await demo(page, name);
		if (name !== 'index.html')
			await page.locator('#contact-method').selectOption('email');
		for (const width of [1400, 1024, 768, 320]) {
			await page.setViewportSize({ width, height: 900 });
			await page
				.locator('input[type="email"]')
				.first()
				.fill('reader@example.com');
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth > innerWidth,
			);
			expect(overflow, `${name} at ${width}px`).toBe(false);
			const pair = page.locator('.code-demo-pair').first();
			await expect(pair).toHaveCSS(
				'flex-direction',
				width < 768 ? 'column' : 'row',
			);
			const field = await pair
				.locator('.demo input[type="email"]')
				.first()
				.boundingBox();
			expect(field.width).toBeGreaterThanOrEqual(120);
		}
		await page.addStyleTag({ content: ':root { font-size: 200%; }' });
		const enlarged = await page
			.locator('.code-demo-pair .demo input[type="email"]')
			.first()
			.boundingBox();
		expect(enlarged.width).toBeGreaterThanOrEqual(120);
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth > innerWidth,
			),
		).toBe(false);
	});

	for (const failure of ['no JavaScript', 'module failure']) {
		test(`${name}: ${failure} retains authored named fields and truthful state cues`, async ({
			browser,
		}) => {
			const context = await browser.newContext({
				javaScriptEnabled: failure !== 'no JavaScript',
				viewport: { width: 320, height: 900 },
			});
			try {
				const page = await context.newPage();
				await page.route(/(\.js(\?|$)|esm\.sh|unpkg\.com)/, (route) =>
					route.abort(),
				);
				await page.goto(`http://127.0.0.1:4180/demo/${name}`);
				const field = page.locator('form-show-if input').first();
				await expect(field).toBeVisible();
				await expect(field).toBeEnabled();
				await field.fill('reader@example.com');
				await expect(field).toHaveValue('reader@example.com');
				await expect(field).toHaveAccessibleName(/.+/);
				if (name === 'index.html') {
					await expect(
						page.locator('.state-on').last(),
					).toBeVisible();
					await expect(
						page.locator('.state-off').last(),
					).toBeHidden();
				}
				expect(
					await page.evaluate(
						() => document.documentElement.scrollWidth > innerWidth,
					),
				).toBe(false);
			} finally {
				await context.close();
			}
		});
	}
}
