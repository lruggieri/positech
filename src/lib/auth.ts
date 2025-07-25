import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { JWT_SECRET } from '$env/static/private';

export interface User {
	id: string;
	email: string;
	name: string;
	picture: string;
}

export function verifyToken(token: string): User | null {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & User;
		return {
			id: decoded.id,
			email: decoded.email,
			name: decoded.name,
			picture: decoded.picture
		};
	} catch {
		return null;
	}
}

export function getUserFromRequest(request: Request): User | null {
	const cookieHeader = request.headers.get('cookie');
	if (!cookieHeader) return null;

	const cookies = parse(cookieHeader);
	const token = cookies['auth-token'];
	if (!token) return null;

	const user = verifyToken(token);

	return user;
}
