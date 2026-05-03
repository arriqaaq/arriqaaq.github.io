import adapter from '@sveltejs/adapter-static';

// User site at https://arriqaaq.github.io/ → served from root, no subpath.
// Project sites (e.g. https://arriqaaq.github.io/some-repo/) would need '/some-repo'.
// Override via BASE_PATH env var if needed.
const basePath = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: true
		}),
		paths: {
			base: basePath
		},
		prerender: {
			handleHttpError: 'warn',
			handleMissingId: 'warn'
		}
	}
};

export default config;
