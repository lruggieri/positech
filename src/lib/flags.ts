export function getCountryFlag(countryCode: string): string {
	if (!countryCode || countryCode.length !== 2) {
		return '';
	}
	
	// Convert ISO 3166-1 alpha-2 country code to flag emoji
	// Each flag emoji is composed of regional indicator symbols
	const codePoints = countryCode
		.toUpperCase()
		.split('')
		.map(char => 127397 + char.charCodeAt(0));
	
	return String.fromCodePoint(...codePoints);
}