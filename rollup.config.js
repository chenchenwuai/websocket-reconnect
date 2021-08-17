/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const babel = require('rollup-plugin-babel')
import typescript from 'typescript'
import typescript2 from 'rollup-plugin-typescript2'
import filesize from 'rollup-plugin-filesize'
import { terser } from 'rollup-plugin-terser'
const pkg = require('./package.json')

const resolve = function (...args) {
	return path.resolve(__dirname, ...args)
}
const extensions = ['.js', '.ts']

const banner =
`/*!
 *  websocket-reconnect v${pkg.version}
 *  (c) 2020-${new Date().getFullYear()} chenwuai
 * Released under the MIT License.
 */`

export default {
	input: resolve('./src/index.ts'),

	plugins: [
		typescript2({
			exclude: 'node_modules/**',
			useTsconfigDeclarationDir: true,
			typescript,
			tsconfig: './tsconfig.json'
		}),
		babel({
			exclude: 'node_modules/**',
			extensions
		}),
		filesize()
	],

	output: [
		{
			format: 'cjs',
			// 生成的文件名和路径
			// package.json的main字段, 也就是模块的入口文件
			file: pkg.main,
			banner,
			plugins: [terser({ compress: { drop_console: true }})]
		},
		{
			format: 'es',
			// rollup和webpack识别的入口文件, 如果没有该字段, 那么会去读取main字段
			file: pkg.module,
			banner,
			sourcemap: true
		},
		{
			format: 'umd',
			name: 'WebsocketReconnect',
			file: pkg.browser,
			banner,
			plugins: [terser()]
		},
		{
			file: 'lib/websocket-reconnect-iife.js',
			format: 'iife',
			name: 'WebsocketReconnect'
		}
	]
}
