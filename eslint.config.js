import config from '@open-wc/eslint-config';

export default [
	...config,
	{
		ignores: ['node_modules/**', 'package-lock.json'],
	},
	{
		rules: {
			'arrow-parens': ['error', 'always'],
		},
	},
	{
		files: ['**/*.test.js', 'test/**/*.js', 'vitest.config.js'],
		rules: {
			'import-x/no-extraneous-dependencies': [
				'error',
				{ devDependencies: true },
			],
		},
	},
];
