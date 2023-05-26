import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default [{
		input: "./src/index.ts",
		output: [{
				file: "./build/index.esm.js",
				format: "esm",
				exports: "named",
				preserveModules: false,
			},
			{
				file: "./build/index.cjs.js",
				format: "cjs",
			},
			{
				file: "./build/index.es5.js",
				format: "iife",
				name: "openrct2_lib_persistence",
				sourcemap: true,
			},
		],
		plugins: [
			resolve(),
			typescript(),
			terser({
				format: {
					preamble: "// Copyright (c) 2023 Sadret",
				},
			}),
		],
	},
	{
		input: "./src/index.ts",
		output: {
			file: "./build/index.d.ts",
			format: "esm",
		},
		plugins: [
			dts({
				tsconfig: "./tsconfig.json",
				compilerOptions: {
					declaration: true,
					declarationDir: "./@types",
					emitDeclarationOnly: true,
					target: "ESNext",
				},
			}),
		],
	},
];
