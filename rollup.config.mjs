import copy from '@guanghechen/rollup-plugin-copy';

const staticFiles = [
	'assets',
	'icons',
	'fonts',
	'lang',
	'templates',
	'templatesV13',
	'system.json',
	// 'LICENCE'
];

export default [{
	input: "./src/skyfall.mjs",
	output: {
		file: "./dist/skyfall.mjs",
		format: "es",
		sourcemap: true
	},
	plugins: [
		copy({
			targets: [
				{
					src: staticFiles.map((f) => `static/${f}`),
					dest: 'dist',
				},
			]
		})
	]
}];