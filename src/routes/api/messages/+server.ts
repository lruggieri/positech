import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRandomMessages, getMessageCount } from '$lib/redis';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const countParam = url.searchParams.get('count');
		const count = countParam ? parseInt(countParam, 10) : 10;

		if (count < 1 || count > 50) {
			return json({ error: 'Count must be between 1 and 50' }, { status: 400 });
		}

		const messages = await getRandomMessages(count);
		const totalCount = await getMessageCount();

		return json({
			messages,
			totalCount,
			requestedCount: count,
			returnedCount: messages.length
		});
	} catch (error) {
		console.error('Error fetching messages:', error);
		return json({ error: 'Failed to fetch messages' }, { status: 500 });
	}
};
