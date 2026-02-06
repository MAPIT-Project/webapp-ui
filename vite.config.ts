import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['@supabase/auth-helpers-sveltekit']
	},
	server: {
		allowedHosts: ['mapit.work']
	}
});
