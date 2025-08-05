import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Return metadata for the page
	return {
		meta: {
			title: 'Positech - Echoes of Positivity | Share Inspiring Messages Worldwide',
			description: 'Discover and share positive messages from around the world. Watch beautiful floating affirmations, create your own inspiring echoes, and join a global community spreading positivity and wellness.',
			url: url.href,
			image: `${url.origin}/og-image.png`
		}
	};
};