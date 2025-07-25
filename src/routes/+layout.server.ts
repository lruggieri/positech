import type { LayoutServerLoad } from './$types';
import { getUserFromRequest } from '$lib/auth';

export const load: LayoutServerLoad = async ({ request }) => {
	const user = getUserFromRequest(request);

	return {
		user
	};
};
