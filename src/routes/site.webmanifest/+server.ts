import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const manifest = {
		name: 'Positech - Echoes of Positivity',
		short_name: 'Echoes',
		description: 'Share and discover positive messages from around the world. Create beautiful floating affirmations and spread positivity globally.',
		start_url: '/',
		display: 'standalone',
		background_color: '#f0f8ff',
		theme_color: '#4682B4',
		orientation: 'portrait-primary',
		lang: 'en-US',
		scope: '/',
		icons: [
			{
				src: '/favicon.svg',
				sizes: 'any',
				type: 'image/svg+xml'
			}
		],
		categories: ['wellness', 'lifestyle', 'entertainment', 'social']
	};

	return new Response(JSON.stringify(manifest, null, 2), {
		headers: {
			'Content-Type': 'application/manifest+json',
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			'Pragma': 'no-cache',
			'Expires': '0'
		}
	});
};