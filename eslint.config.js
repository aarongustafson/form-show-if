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
];
