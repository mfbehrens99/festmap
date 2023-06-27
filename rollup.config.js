import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy'
import { terser } from "rollup-plugin-terser";

import postcss from 'rollup-plugin-postcss';
import postcssImport from 'postcss-import';
import postcssCopy from 'postcss-copy';

import pkg from './package.json'

const production = !process.env.ROLLUP_WATCH
const bannerContent = `
/**
 * ${pkg.name}
 * ${pkg.description}
 *
 * @version ${pkg.version}
 * @author ${pkg.author}
 * @license ${pkg.license}
 * @link ${pkg.repository.url}
 */
`.trimStart()

module.exports = [
  {
    input: pkg.module,
    output: {
      file: pkg.main,
      format: 'umd',
      sourcemap: production ? false : true,
      banner: bannerContent
    },
    plugins: [
      resolve(),
      commonjs(),
      copy({
        targets: [
          { src: 'src/index.html', dest: 'dist' },
        ]
      }),
      production && terser({
        mangle: true,
        format: {
          comments: false,
          preamble: bannerContent,
        }
      }),
    ]
  },
  {
    input: 'src/styles/main.css',
    output: {
      file: pkg.style,
      format: 'es'
    },
    plugins: [
      postcss({
        extract: true,
        inject: false,
        minimize: production ? true : false,
        plugins: [
          postcssImport({}),
          postcssCopy({
            basePath: 'node_modules',
            dest: "dist",
            template: "images/[path][name].[ext]",
          })
        ]
      })
    ]
  },
];
