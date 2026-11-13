import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['form-show-if.test.js', 'test/**/*.test.js'],
		environment: 'happy-dom',
		globals: true,
		setupFiles: ['./test/setup.js'],
	},
});
