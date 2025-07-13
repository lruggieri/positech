import { createClient } from 'redis';
import { env } from '$env/dynamic/private';

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
}

export const MESSAGES_SET_KEY = 'positive_messages';

export async function storeMessage(message: string): Promise<void> {
	const redis = await getRedisClient();
	const storedMessage: StoredMessage = {
		msg: message,
		timestamp: Date.now(),
		id: crypto.randomUUID()
	};
	
	await redis.sAdd(MESSAGES_SET_KEY, JSON.stringify(storedMessage));
}

export async function getRandomMessages(count: number = 10): Promise<string[]> {
	const redis = await getRedisClient();
	const messages = await redis.sRandMemberCount(MESSAGES_SET_KEY, count);

	console.log("messages", messages);

	if (!messages || messages.length === 0) {
		// Return fallback messages if Redis is empty
		return [];
	}
	
	return messages.map((msg: string) => {
		try {
			const parsed: StoredMessage = JSON.parse(msg);
			return parsed.msg;
		} catch {
			return msg; // Fallback for non-JSON messages
		}
	});
}

export async function getMessageCount(): Promise<number> {
	const redis = await getRedisClient();
	return await redis.sCard(MESSAGES_SET_KEY);
}