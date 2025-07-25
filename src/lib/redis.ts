import { createClient } from 'redis';
import { env } from '$env/dynamic/private';
import { createHash } from 'crypto';

let client: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
	if (!client) {
		client = createClient({
			url: env.REDIS_URL || 'redis://localhost:6379',
			database: env.REDIS_DB ? parseInt(env.REDIS_DB, 10) : 0
		});

		client.on('error', (err: Error) => {
			console.error('Redis Client Error:', err);
		});

		await client.connect();
	}

	return client;
}

export async function closeRedisClient() {
	if (client) {
		await client.destroy();
		client = null;
	}
}

export interface StoredMessage {
	msg: string;
	timestamp: number;
	id: string;
	userEmailHashed?: string;
	country?: string;
}

export const MESSAGES_SET_KEY = 'positive_messages';

function hashEmail(email: string): string {
	const salt = env.EMAIL_HASH_SALT || 'fallback_salt';
	return createHash('sha256').update(email + salt).digest('hex');
}

function hashIP(ip: string): string {
	const salt = env.EMAIL_HASH_SALT || 'fallback_salt';
	return createHash('sha256').update(ip + salt).digest('hex');
}

export async function storeMessage(message: string, userEmail?: string, countryCode?: string): Promise<void> {
	const redis = await getRedisClient();
	const storedMessage: StoredMessage = {
		msg: message,
		timestamp: Date.now(),
		id: crypto.randomUUID(),
		// do not store any user information in clear text anywhere in the DB
		...(userEmail && { userEmailHashed: hashEmail(userEmail) }),
		...(countryCode && { country: countryCode })
	};

	await redis.sAdd(MESSAGES_SET_KEY, JSON.stringify(storedMessage));
}

export interface MessageWithCountry {
	msg: string;
	country?: string;
}

export async function getRandomMessages(count: number = 10): Promise<MessageWithCountry[]> {
	const redis = await getRedisClient();
	const messages = await redis.sRandMemberCount(MESSAGES_SET_KEY, count);

	if (!messages || messages.length === 0) {
		// Return fallback messages if Redis is empty
		return [];
	}

	return messages.map((msg: string) => {
		try {
			const parsed: StoredMessage = JSON.parse(msg);
			return {
				msg: parsed.msg,
				country: parsed.country
			};
		} catch {
			return { msg }; // Fallback for non-JSON messages
		}
	});
}

export async function getMessageCount(): Promise<number> {
	const redis = await getRedisClient();
	return await redis.sCard(MESSAGES_SET_KEY);
}

const MAX_MESSAGES_PER_DAY = 10;
const RATE_LIMIT_WINDOW_SECONDS = 24 * 60 * 60; // 24 hours

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetTime: number;
}

export async function checkRateLimit(userEmail?: string, userIP?: string): Promise<RateLimitResult> {
	const redis = await getRedisClient();
	
	// Determine the user identifier - prefer email over IP
	let userKey: string;
	if (userEmail) {
		userKey = `msg_counter_${hashEmail(userEmail)}`;
	} else if (userIP) {
		userKey = `msg_counter_${hashIP(userIP)}`;
	} else {
		throw new Error('Either userEmail or userIP must be provided');
	}
	
	const currentCount = await redis.get(userKey);
	const count = currentCount ? parseInt(currentCount, 10) : 0;
	
	if (count >= MAX_MESSAGES_PER_DAY) {
		const ttl = await redis.ttl(userKey);
		const resetTime = Date.now() + (ttl * 1000);
		return {
			allowed: false,
			remaining: 0,
			resetTime
		};
	}
	
	return {
		allowed: true,
		remaining: MAX_MESSAGES_PER_DAY - count - 1,
		resetTime: Date.now() + (RATE_LIMIT_WINDOW_SECONDS * 1000)
	};
}

export async function incrementMessageCount(userEmail?: string, userIP?: string): Promise<void> {
	const redis = await getRedisClient();
	
	// Determine the user identifier - prefer email over IP
	let userKey: string;
	if (userEmail) {
		userKey = `msg_counter_${hashEmail(userEmail)}`;
	} else if (userIP) {
		userKey = `msg_counter_${hashIP(userIP)}`;
	} else {
		throw new Error('Either userEmail or userIP must be provided');
	}
	
	const currentCount = await redis.get(userKey);
	
	if (currentCount) {
		await redis.incr(userKey);
	} else {
		await redis.setEx(userKey, RATE_LIMIT_WINDOW_SECONDS, '1');
	}
}
