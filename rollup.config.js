import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy'

import postcss from 'rollup-plugin-postcss';
import postcssImport from 'postcss-import';
import postcssCopy from 'postcss-copy';


module.exports = [
  {
    input: 'src/main.js',
    output: {
      file: 'dist/festmap-src.js',
      format: 'umd',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      copy({
        targets: [
          {src: 'src/index.html', dest: 'dist'},
        ]
      })
    ]
  },
  {
    input: 'src/styles/main.css',
    output: {
      file: 'dist/festmap.css',
      format: 'es'
    },
    plugins: [
      postcss({
        extract: true,
        inject: false,
        minimize: true,
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
