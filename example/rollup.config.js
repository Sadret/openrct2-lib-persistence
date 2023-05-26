import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
	input: "./index.ts",
	output: {
		format: "iife",
		file: `./build/openrct2-lib-persistence-example.js`,
	},
	plugins: [
		resolve(),
		typescript(),
		terser({
			format: {
				preamble: "// Copyright (c) 2023 Sadret",
			},
		}),
	],
};
