import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Return metadata for the page
	return {
		meta: {
			title: 'Positech - Share Positive Messages & Affirmations',
			description: 'Share positive messages and affirmations with the world. Create floating inspirational quotes and join a global community spreading positivity.',
			url: url.href,
			image: `${url.origin}/og-image.png`
		}
	};
};