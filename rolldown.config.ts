import swc from '@rollup/plugin-swc'
import { defineConfig } from 'rolldown'
import { withFilter } from 'rolldown/filter'
import { esmExternalRequirePlugin } from 'rolldown/plugins'

export default defineConfig({
	input: 'src/extension.ts',
	external: ['vscode'],
	output: {
		file: `dist/extension.js`,
		sourcemap: true,
	},
	platform: 'node',
	plugins: [
		// https://github.com/oxc-project/oxc/issues/9170
		// TODO: also replace @swc-node/register in .vscode-test.mjs
		withFilter(
			swc({
				swc: {
					jsc: {
						target: 'esnext',
						parser: { decorators: true, syntax: 'typescript' },
						transform: { decoratorVersion: '2023-11' },
					},
				},
			}),
			// Only run this transform if the file contains a decorator.
			{ transform: { code: /\w*@/ } },
		),
		// https://github.com/npm/node-which/issues/174
		esmExternalRequirePlugin({ external: [/^node:/, 'path'] }),
	],
})
