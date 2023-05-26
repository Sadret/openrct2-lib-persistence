import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default [{
		input: "./src/index.ts",
		output: [{
				file: "./build/openrct2-lib-persistence.esm.js",
				format: "esm",
				exports: "named",
				preserveModules: false,
				sourcemap: true,
			},
			{
				file: "./build/openrct2-lib-persistence.cjs.js",
				format: "cjs",
				sourcemap: true,
			},
			{
				file: "./build/openrct2-lib-persistence.es5.js",
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
			file: "./build/openrct2-lib-persistence.d.ts",
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
