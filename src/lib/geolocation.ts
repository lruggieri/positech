interface IpApiResponse {
	country_code: string;
	[key: string]: any;
}

interface CachedLocation {
	country_code: string;
	timestamp: number;
}

const CACHE_KEY = 'user_location';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

export async function getCountryCode(): Promise<string | null> {
	try {
		// Check localStorage cache first
		const cached = localStorage.getItem(CACHE_KEY);
		if (cached) {
			const cachedData: CachedLocation = JSON.parse(cached);
			const isExpired = Date.now() - cachedData.timestamp > CACHE_DURATION;
			
			if (!isExpired) {
				return cachedData.country_code;
			}
		}

		// Fetch from ipapi.co
		const response = await fetch('https://ipapi.co/json/');
		if (!response.ok) {
			throw new Error('Failed to fetch location data');
		}

		const data: IpApiResponse = await response.json();
		
		// Cache the result
		const cacheData: CachedLocation = {
			country_code: data.country_code,
			timestamp: Date.now()
		};
		localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

		return data.country_code;
	} catch (error) {
		console.error('Error fetching country code:', error);
		return null;
	}
}