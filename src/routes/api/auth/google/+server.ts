import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET } from '$env/static/private';

function getEnvVars() {
	if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !JWT_SECRET) {
		console.error(
			'Missing env vars. Available:',
			Object.keys(process.env).filter((key) => key.includes('GOOGLE') || key.includes('JWT'))
		);
		throw new Error('Missing required environment variables for Google OAuth');
	}

	return { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET };
}

export const GET: RequestHandler = async ({ url }) => {
	const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET } = getEnvVars();
	const code = url.searchParams.get('code');

	if (!code) {
		// Redirect to Google OAuth
		const redirectUri = `${url.origin}/api/auth/google`;
		const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
		googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
		googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
		googleAuthUrl.searchParams.set('response_type', 'code');
		googleAuthUrl.searchParams.set('scope', 'openid email profile');

		throw redirect(302, googleAuthUrl.toString());
	}

	try {
		// Exchange code for token
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				client_id: GOOGLE_CLIENT_ID,
				client_secret: GOOGLE_CLIENT_SECRET,
				code,
				grant_type: 'authorization_code',
				redirect_uri: `${url.origin}/api/auth/google`
			})
		});

		if (!tokenResponse.ok) {
			throw new Error('Failed to exchange code for token');
		}

		const tokenData = await tokenResponse.json();
		const accessToken = tokenData.access_token;

		// Get user info
		const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});

		if (!userResponse.ok) {
			throw new Error('Failed to get user info');
		}

		const userData = await userResponse.json();

		// Create JWT token
		const jwtToken = jwt.sign(
			{
				id: userData.id,
				email: userData.email,
				name: userData.name,
				picture: userData.picture
			},
			JWT_SECRET,
			{ expiresIn: '7d' }
		);

		// Set cookie
		const cookie = serialize('auth-token', jwtToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7, // 7 days
			path: '/'
		});

		// Redirect to home page
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/',
				'Set-Cookie': cookie
			}
		});
	} catch (error) {
		console.error('Google OAuth error:', error);
		return json({ error: 'Authentication failed' }, { status: 500 });
	}
};
