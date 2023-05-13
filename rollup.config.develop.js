import {
	name
} from './package.json';
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
	input: "./src/main.ts",
	output: {
		format: "iife",
		file: `./build/${name}-develop.js`,
	},
	plugins: [
		resolve(),
		typescript(),
	],
};
