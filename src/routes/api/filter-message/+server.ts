import { json } from '@sveltejs/kit';
import { GEMINI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import { storeMessage, checkRateLimit, incrementMessageCount } from '$lib/redis';
import { getUserFromRequest } from '$lib/auth';

interface FilterRequest {
	message: string;
	countryCode?: string;
}

interface FilterResponse {
	isPositive: boolean;
	reason?: string;
}

const LLM_INSTRUCTION = `### Purpose and Goals ###

Classify input messages into positive and non-positive categories.

A positive message must:

* Be uplifting, encouraging, or caring in tone.

* Be directed toward the reader or another person (i.e., it must express kindness, appreciation, praise, compassion, motivation, etc., toward others).

* Contain only positive and unambiguous language.

* Make the reader feel better, appreciated, or emotionally supported.

* Messages that merely express personal preferences, opinions, excitement, or observations (e.g., "I love sushi", "It's sunny today") must NOT be classified as positive unless they are clearly intended to uplift or support another person.

* Messages may be in any language, but responses must always be in English.


### Behaviors and Rules ###

1. Classification Logic

a) Classify a message as positive only if it satisfies all the following:

* Clearly directed toward another person (or the reader).

* Unambiguously supportive, caring, kind, or motivating.

* Contains no neutral, vulgar, or ambiguous content.


b) If a message:

* Is neutral (e.g., factual or self-centered without uplifting intent),

* Is ambiguous in tone,

* Contains any vulgarity or mixed/negative sentiment,

* Or is not clearly directed at another person,

→ then classify it as non-positive.


c) When in doubt, default to non-positive.


### Response Format ###

a) Respond in strict JSON format.
b) The JSON object must have:
{

"isPositive": true or false,

"reason": "..." // Only if isPositive is false
}


### Overall Tone and Principle ###

* Be strict and conservative in classification.

* It's better to misclassify a positive message as non-positive than to classify a neutral or ambiguous message as positive.

* Apply logic objectively without making assumptions about intention beyond what is stated.`;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		const { message, countryCode }: FilterRequest = await request.json();

		if (!message || message.trim().length === 0) {
			return json({ error: 'Message is required' }, { status: 400 });
		}

		// Extract user info for rate limiting
		const user = getUserFromRequest(request);
		const userEmail = user?.email;
		const userIP = getClientAddress();

		// Check rate limit before processing
		const rateLimitResult = await checkRateLimit(userEmail, userIP);
		if (!rateLimitResult.allowed) {
			return json({ 
				error: 'Rate limit exceeded. You can send up to 10 messages per day.',
				rateLimitExceeded: true,
				remaining: rateLimitResult.remaining,
				resetTime: rateLimitResult.resetTime
			}, { status: 429 });
		}

		console.log(GEMINI_API_KEY);
		if (!GEMINI_API_KEY) {
			return json({ error: 'Gemini API key not configured' }, { status: 500 });
		}

		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
			{
				method: 'POST',
				headers: {
					'x-goog-api-key': GEMINI_API_KEY,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					system_instruction: {
						parts: [
							{
								text: `${LLM_INSTRUCTION}`
							}
						]
					},
					contents: [
						{
							parts: [
								{
									text: `"${message}"`
								}
							]
						}
					]
				})
			}
		);

		if (!response.ok) {
			const errorData = await response.text();
			console.error('Gemini API error:', errorData);
			return json({ error: 'Failed to process message' }, { status: 500 });
		}

		const data = await response.json();
		console.log(data);
		const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!generatedText) {
			return json({ error: 'No response from Gemini API' }, { status: 500 });
		}

		// Parse the JSON response from Gemini
		let filterResult: FilterResponse;
		try {
			// Extract JSON from the response (remove any markdown formatting)
			const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('No JSON found in response');
			}
			filterResult = JSON.parse(jsonMatch[0]);
		} catch {
			console.error('Failed to parse Gemini response:', generatedText);
			return json({ error: 'Failed to parse AI response' }, { status: 500 });
		}

		// Store message in Redis if it's positive
		if (filterResult.isPositive) {
			try {
				await storeMessage(message.trim(), userEmail, countryCode);
				// Increment rate limit counter after successful storage
				await incrementMessageCount(userEmail, userIP);
			} catch (redisError) {
				console.error('Failed to store message in Redis:', redisError);
				// Don't fail the request if Redis fails, just log it
			}
		}

		return json(filterResult);
	} catch (error) {
		console.error('Error in message filtering:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
