import type { LayoutServerLoad } from './$types';
import { getUserFromRequest } from '$lib/auth';

export const load: LayoutServerLoad = async ({ request }) => {
	console.log("Hi!");
	const user = getUserFromRequest(request);

	return {
		user
	};
};
