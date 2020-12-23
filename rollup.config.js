import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import sveltePreprocess from 'svelte-preprocess';
import pkg from './package.json';
import css from 'rollup-plugin-css-only';
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';

let production = !process.env.ROLLUP_WATCH;
const doc = process.env.NODE_ENV === "doc";
let bundleCss = (production && !doc) ? 'svetamat.css' : 'bundle.css';
if(doc) {
  bundleCss = 'bundle.css';
}

const name = pkg.name
	.replace(/^(@\S+\/)?(svelte-)?(\S+)/, '$3')
	.replace(/^\w/, m => m.toUpperCase())
	.replace(/-\w/g, m => m[1].toUpperCase());

export default {
	input: (production && !doc) ? 'src/index.js' : 'src/main.js',
  output: production ? doc ? {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'docs/bundle.js',
  } : [
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true,
        name,
      },
      {
        file: pkg.main,
        format: 'umd',
        sourcemap: true,
        name,
      },
    ] : {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: 'public/bundle.js',
    },
	plugins: [
		svelte({
			preprocess: sveltePreprocess({
				postcss: { postcss: true }
			}),
		}),
		css({ output: bundleCss }),
		resolve({
      browser: true,
      mainFields: ['svelte', 'module', 'main'],
      dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/'),
		}),
		!production && serve({ port: 5001, contentBase: 'public' }),
    !production && livereload({ watch: 'public' }),
    production && terser(),
	],
	watch: {
    clearScreen: false,
  },
};
