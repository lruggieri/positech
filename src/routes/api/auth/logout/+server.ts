import type { RequestHandler } from './$types';
import { serialize } from 'cookie';

export const POST: RequestHandler = async () => {
	// Clear the auth cookie
	const cookie = serialize('auth-token', '', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 0, // Expire immediately
		path: '/'
	});

	return new Response(null, {
		status: 200,
		headers: {
			'Set-Cookie': cookie
		}
	});
};
