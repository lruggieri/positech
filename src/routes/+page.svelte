<script lang="ts">
	import { onMount } from 'svelte';
	import { getCountryCode } from '$lib/geolocation';
	import { getCountryFlag } from '$lib/flags';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';

	let { data } = $props();

	const maxMessages: number = 10;
	const movementSpeed: number = 1;

	interface Message {
		id: number;
		text: string;
		x: number;
		y: number;
		targetX: number;
		targetY: number;
		opacity: number;
		phase: 'fade-in' | 'visible' | 'fade-out';
		fadeTimer: number;
		width: number;
		height: number;
		velocityX: number;
		velocityY: number;
		country?: string;
	}

	let messages: Message[] = $state([]);
	let messageId = 0;
	let animationFrame: number;
	let sidePanelOpen = $state(false);
	let messageText = $state('');
	let isSubmitting = $state(false);
	let submitMessage = $state('');
	let submitMessageType: 'success' | 'error' | '' = $state('');
	let availableMessages: Array<{msg: string, country?: string}> = $state([]);

	const user = $derived(data.user);

	// Debug logging (remove in production)
	$effect(() => {
		if (import.meta.env.DEV) {
			console.log('User data:', user);
			console.log('Full data:', data);
		}
	});

	const fallbackMessages: string[] = [
		'You are capable of amazing things',
		'Every day is a new opportunity',
		'Your potential is limitless',
		'Believe in yourself',
		'You make a difference',
		'Today is full of possibilities',
		'You are stronger than you think',
		'Your kindness matters',
		'You have unique gifts to share',
		'Progress, not perfection',
		'You are worthy of good things',
		'Your dreams are valid',
		'You can overcome any challenge',
		'You bring light to the world',
		'Every step forward counts',
		'You are exactly where you need to be',
		'Your efforts are making a difference',
		'You have the power to create change',
		'You are loved and appreciated',
		'Tomorrow is full of promise'
	];

	async function loadMessages() {
		try {
			const response = await fetch('/api/messages?count=20');
			if (response.ok) {
				const data = await response.json();
				if (data.messages && data.messages.length > 0) {
					availableMessages = data.messages;
				} else {
					availableMessages = fallbackMessages.map(msg => ({ msg }));
				}
			} else {
				if (import.meta.env.DEV) {
					console.error('Failed to load messages from API');
				}
				availableMessages = fallbackMessages.map(msg => ({ msg }));
			}
		} catch (error) {
			if (import.meta.env.DEV) {
				console.error('Error loading messages:', error);
			}
			availableMessages = fallbackMessages.map(msg => ({ msg }));
		}
	}

	function getRandomMessage(): {msg: string, country?: string} {
		if (availableMessages.length === 0) {
			return { msg: fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)] };
		}
		return availableMessages[Math.floor(Math.random() * availableMessages.length)];
	}

	function calculateMessageDimensions(text: string): { width: number; height: number } {
		// Create a temporary element to measure text dimensions
		const temp = document.createElement('div');
		temp.style.position = 'absolute';
		temp.style.visibility = 'hidden';
		temp.style.fontSize = '1.1rem';
		temp.style.fontWeight = '400';
		temp.style.padding = '12px 20px';
		temp.style.borderRadius = '25px';
		temp.style.whiteSpace = 'nowrap';
		temp.style.maxWidth = '300px';
		temp.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
		temp.textContent = text;

		document.body.appendChild(temp);
		const rect = temp.getBoundingClientRect();
		const width = rect.width;
		const height = rect.height;
		document.body.removeChild(temp);

		return { width, height };
	}

	function createMessage(): Message {
		const messageData = getRandomMessage();
		const text = messageData.msg;
		const dimensions = calculateMessageDimensions(text);
		const side = Math.floor(Math.random() * 4);
		let startX: number, startY: number, endX: number, endY: number;

		const margin = 20;

		switch (side) {
			case 0: // top
				startX = Math.random() * (window.innerWidth - dimensions.width - 2 * margin) + margin;
				startY = margin;
				endX = Math.random() * (window.innerWidth - dimensions.width - 2 * margin) + margin;
				endY = window.innerHeight - dimensions.height - margin;
				break;
			case 1: // right
				startX = window.innerWidth - dimensions.width - margin;
				startY = Math.random() * (window.innerHeight - dimensions.height - 2 * margin) + margin;
				endX = margin;
				endY = Math.random() * (window.innerHeight - dimensions.height - 2 * margin) + margin;
				break;
			case 2: // bottom
				startX = Math.random() * (window.innerWidth - dimensions.width - 2 * margin) + margin;
				startY = window.innerHeight - dimensions.height - margin;
				endX = Math.random() * (window.innerWidth - dimensions.width - 2 * margin) + margin;
				endY = margin;
				break;
			default: // left
				startX = margin;
				startY = Math.random() * (window.innerHeight - dimensions.height - 2 * margin) + margin;
				endX = window.innerWidth - dimensions.width - margin;
				endY = Math.random() * (window.innerHeight - dimensions.height - 2 * margin) + margin;
				break;
		}

		// Calculate constant velocity vector
		const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
		const velocityX = ((endX - startX) / distance) * movementSpeed;
		const velocityY = ((endY - startY) / distance) * movementSpeed;

		return {
			id: messageId++,
			text: text,
			x: startX,
			y: startY,
			targetX: endX,
			targetY: endY,
			opacity: 0,
			phase: 'fade-in',
			fadeTimer: 0,
			width: dimensions.width,
			height: dimensions.height,
			velocityX: velocityX,
			velocityY: velocityY,
			country: messageData.country
		};
	}

	async function submitEcho() {
		if (!messageText.trim() || isSubmitting) return;

		isSubmitting = true;
		submitMessage = '';
		submitMessageType = '';

		try {
			// Get country code from geolocation service
			const countryCode = await getCountryCode();
			
			const response = await fetch('/api/filter-message', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ 
					message: messageText.trim(),
					countryCode 
				})
			});

			const result = await response.json();

			if (!response.ok) {
				if (response.status === 429) {
					// Rate limit exceeded
					submitMessage = result.error || 'You have reached your daily limit of 10 messages. Please try again tomorrow.';
					submitMessageType = 'error';
					isSubmitting = false;
					return;
				}
				throw new Error(result.error || 'Failed to submit message');
			}

			if (result.isPositive) {
				submitMessage = 'Your echo has been shared! Thank you for spreading positivity.';
				submitMessageType = 'success';

				// Add the message to the floating messages immediately
				const userMessage = createMessage();
				userMessage.text = messageText.trim();
				messages = [...messages, userMessage];

				messageText = '';
			} else {
				submitMessage =
					result.reason || 'Your message could not be shared. Please try a more positive message.';
				submitMessageType = 'error';
			}
		} catch (error) {
			if (import.meta.env.DEV) {
				console.error('Error submitting message:', error);
			}
			submitMessage = 'Sorry, something went wrong. Please try again.';
			submitMessageType = 'error';
		} finally {
			isSubmitting = false;

			// Clear the message after 5 seconds
			setTimeout(() => {
				submitMessage = '';
				submitMessageType = '';
			}, 5000);
		}
	}

	async function logout() {
		try {
			await fetch('/api/auth/logout', {
				method: 'POST'
			});
			// Reload the page to update the user state
			window.location.reload();
		} catch (error) {
			if (import.meta.env.DEV) {
				console.error('Logout error:', error);
			}
		}
	}

	function updateMessages() {
		messages = messages
			.map((message) => {
				const newMessage = { ...message };

				// Move message with constant velocity
				newMessage.x += newMessage.velocityX;
				newMessage.y += newMessage.velocityY;

				// Check if message edge is within 20px of screen border
				const margin = 20;
				const leftEdge = newMessage.x;
				const rightEdge = newMessage.x + newMessage.width;
				const topEdge = newMessage.y;
				const bottomEdge = newMessage.y + newMessage.height;

				const nearScreenEdge =
					leftEdge < margin ||
					rightEdge > window.innerWidth - margin ||
					topEdge < margin ||
					bottomEdge > window.innerHeight - margin;

				// Handle fade phases
				if (newMessage.phase === 'fade-in') {
					newMessage.fadeTimer += 1;
					if (newMessage.fadeTimer < 60) {
						// 60 frames to fade in
						newMessage.opacity = newMessage.fadeTimer / 60;
					} else {
						newMessage.phase = 'visible';
						newMessage.opacity = 1;
						newMessage.fadeTimer = 0;
					}
				} else if (newMessage.phase === 'visible' && nearScreenEdge) {
					newMessage.phase = 'fade-out';
					newMessage.fadeTimer = 0;
				} else if (newMessage.phase === 'fade-out') {
					newMessage.fadeTimer += 1;
					if (newMessage.fadeTimer < 60) {
						// 60 frames to fade out
						newMessage.opacity = 1 - newMessage.fadeTimer / 60;
					} else {
						newMessage.opacity = 0;
					}
				}

				return newMessage;
			})
			.filter((message) => message.opacity > 0);

		if (messages.length < maxMessages && Math.random() < 0.05) {
			messages = [...messages, createMessage()];
		}

		animationFrame = requestAnimationFrame(updateMessages);
	}

	onMount(() => {
		const initializeApp = async () => {
			await loadMessages();

			for (let i = 0; i < maxMessages; i++) {
				messages.push(createMessage());
			}
			updateMessages();
		};

		initializeApp();

		// Reload messages every 5 minutes to get fresh content
		const messageReloadInterval = setInterval(loadMessages, 5 * 60 * 1000);

		return () => {
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
			clearInterval(messageReloadInterval);
		};
	});
</script>

<main>
	<header>
		<h1 class="title">Echoes</h1>
	</header>

	<div class="top-right-controls">
		<ThemeSelector />
		<button
			class="side-panel-trigger"
			onclick={() => (sidePanelOpen = !sidePanelOpen)}
			aria-label="Open side panel to add your positive message"
		>
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				role="img"
				aria-label="Plus icon"
			>
				<path d="M12 5v14M5 12h14" />
			</svg>
		</button>
	</div>

	<div class="bottom-left-links">
		<a
			href="https://github.com/lruggieri/positech"
			target="_blank"
			rel="noopener noreferrer"
			class="icon-link"
			aria-label="View source code on GitHub"
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="GitHub logo">
				<path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
			</svg>
		</a>
		<a
			href="https://www.buymeacoffee.com/luca.ruggieri"
			target="_blank"
			rel="noopener noreferrer"
			class="icon-link coffee-link"
			aria-label="Buy me a coffee to support this project"
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="Coffee cup icon">
				<path d="M20 3H4a1 1 0 0 0-1 1v8a8 8 0 0 0 8 8h2a8 8 0 0 0 8-8V4a1 1 0 0 0-1-1zM5 5h14v7a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6V5z"/>
				<path d="M7 7h10v2H7zM7 10h6v2H7z"/>
			</svg>
		</a>
	</div>

	<div class="messages-container">
		{#each messages as message (message.id)}
			<div
				class="floating-message"
				style="
					left: {message.x}px;
					top: {message.y}px;
					opacity: {message.opacity};
				"
			>
				{message.text}
				{#if message.country}
					<span class="country-flag">{getCountryFlag(message.country)}</span>
				{/if}
			</div>
		{/each}
	</div>

	<aside class="side-panel" class:open={sidePanelOpen} aria-label="Message submission panel">
		<header class="side-panel-header">
			<h2>Add Your Echo</h2>
			<button
				class="close-button"
				onclick={() => (sidePanelOpen = false)}
				aria-label="Close message submission panel"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					role="img"
					aria-label="Close icon"
				>
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			</button>
		</header>

		<div class="side-panel-content">
			<section class="message-form-section">
				<h3>Share a positive message</h3>
				<label for="message-input" class="visually-hidden">Your positive message</label>
				<textarea
					id="message-input"
					bind:value={messageText}
					placeholder="Write your positive message here..."
					class="message-input"
					maxlength="150"
					rows="4"
					aria-describedby="character-count submit-message"
				></textarea>
				<div id="character-count" class="character-count">{messageText.length}/150</div>
				<button
					class="submit-button"
					disabled={messageText.trim().length === 0 || isSubmitting}
					onclick={submitEcho}
				>
					{isSubmitting ? 'Sharing...' : 'Share Echo'}
				</button>

				{#if submitMessage}
					<div
						id="submit-message"
						class="submit-message"
						class:success={submitMessageType === 'success'}
						class:error={submitMessageType === 'error'}
						role="alert"
						aria-live="polite"
					>
						{submitMessage}
					</div>
				{/if}
			</section>

			{#if !user}
				<div class="login-section">
					<h3>Login to share more</h3>
					<p class="login-description">
						Login to share up to 10 echoes per day and help spread positivity!
					</p>
					<a href="/api/auth/google" class="google-login-button">
						<svg width="20" height="20" viewBox="0 0 24 24">
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="#FBBC05"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Continue with Google
					</a>
				</div>
			{:else}
				<div class="user-section">
					<div class="user-info">
						<img src={user.picture} alt={user.name} class="user-avatar" />
						<div class="user-details">
							<h3>{user.name}</h3>
							<p class="user-email">{user.email}</p>
						</div>
					</div>
					<button class="logout-button" onclick={logout}> Logout </button>
				</div>
			{/if}
		</div>
	</aside>

	{#if sidePanelOpen}
		<div class="side-panel-overlay" onclick={() => (sidePanelOpen = false)}></div>
	{/if}
</main>

<style>
	:global(:root) {
		--theme-primary: rgba(70, 130, 180, 0.9);
		--theme-primary-light: rgba(173, 216, 230, 0.2);
		--theme-primary-dark: rgba(70, 130, 180, 1);
		--theme-text: rgba(70, 130, 180, 0.9);
		--theme-background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
		--theme-message-background: rgba(173, 216, 230, 0.2);
		--theme-message-border: rgba(173, 216, 230, 0.3);
	}

	:global(body) {
		margin: 0;
		padding: 0;
		height: 100vh;
		overflow: hidden;
		background: var(--theme-background);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	main {
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}

	header {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		z-index: 1;
		max-width: 90%;
	}

	.title {
		font-size: 3rem;
		font-weight: 300;
		color: rgba(100, 150, 200, 0.8);
		margin: 0 0 1rem 0;
		text-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
		letter-spacing: 0.05em;
		line-height: 1.2;
	}

	.messages-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.floating-message {
		position: absolute;
		color: var(--theme-text);
		font-size: 1.1rem;
		font-weight: 400;
		padding: 12px 20px;
		background: var(--theme-message-background);
		border-radius: 25px;
		backdrop-filter: blur(10px);
		border: 1px solid var(--theme-message-border);
		white-space: nowrap;
	}

	.country-flag {
		position: absolute;
		top: -8px;
		right: -8px;
		font-size: 0.8rem;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 50%;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.top-right-controls {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 1000;
		display: flex;
		flex-direction: row;
		gap: 12px;
		align-items: center;
	}

	.side-panel-trigger {
		background: var(--theme-message-background);
		border: 1px solid var(--theme-message-border);
		border-radius: 50%;
		padding: 15px;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
		color: var(--theme-text);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		width: 54px;
		height: 54px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.side-panel-trigger:hover {
		background: var(--theme-primary-light);
		transform: scale(1.05);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
	}

	.side-panel {
		position: fixed;
		top: 0;
		right: 0;
		height: 100vh;
		width: 400px;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		border-left: 1px solid rgba(173, 216, 230, 0.3);
		z-index: 1001;
		transform: translateX(100%);
		transition: transform 0.3s ease;
		box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
		overflow-y: auto;
	}

	.side-panel.open {
		transform: translateX(0);
	}

	.side-panel-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(2px);
		z-index: 1000;
	}

	.side-panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid rgba(173, 216, 230, 0.3);
	}

	.side-panel-header h2 {
		margin: 0;
		color: rgba(70, 130, 180, 0.9);
		font-size: 1.5rem;
		font-weight: 500;
	}

	.close-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 8px;
		color: rgba(70, 130, 180, 0.7);
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background: rgba(173, 216, 230, 0.3);
		color: rgba(70, 130, 180, 1);
	}

	.side-panel-content {
		padding: 20px;
	}

	.message-form-section {
		margin-bottom: 40px;
	}

	.message-form-section h3 {
		margin: 0 0 15px 0;
		color: rgba(70, 130, 180, 0.9);
		font-size: 1.2rem;
		font-weight: 500;
	}

	.bottom-left-links {
		position: fixed;
		bottom: 20px;
		left: 20px;
		z-index: 500;
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.icon-link {
		opacity: 0.3;
		color: rgba(70, 130, 180, 0.6);
		transition: all 0.3s ease;
		text-decoration: none;
		padding: 8px;
		border-radius: 6px;
		backdrop-filter: blur(5px);
		background: rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-link:hover {
		opacity: 0.8;
		color: rgba(70, 130, 180, 0.9);
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-1px);
	}

	.coffee-link:hover {
		color: rgba(255, 140, 0, 0.9);
	}

	.message-input {
		width: 100%;
		padding: 15px;
		border: 1px solid rgba(173, 216, 230, 0.5);
		border-radius: 12px;
		font-size: 1rem;
		font-family: inherit;
		resize: vertical;
		min-height: 80px;
		background: rgba(255, 255, 255, 0.8);
		color: rgba(70, 130, 180, 0.9);
		transition: border-color 0.2s ease;
	}

	.message-input:focus {
		outline: none;
		border-color: rgba(70, 130, 180, 0.7);
	}

	.message-input::placeholder {
		color: rgba(70, 130, 180, 0.5);
	}

	.character-count {
		text-align: right;
		font-size: 0.9rem;
		color: rgba(70, 130, 180, 0.6);
		margin-top: 8px;
		margin-bottom: 15px;
	}

	.submit-button {
		width: 100%;
		padding: 15px;
		background: rgba(173, 216, 230, 0.8);
		color: rgba(70, 130, 180, 0.9);
		border: 1px solid rgba(173, 216, 230, 0.3);
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.submit-button:hover:not(:disabled) {
		background: rgba(173, 216, 230, 1);
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.submit-message {
		margin-top: 15px;
		padding: 12px 16px;
		border-radius: 8px;
		font-size: 0.9rem;
		line-height: 1.4;
		text-align: center;
		transition: all 0.3s ease;
	}

	.submit-message.success {
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.2);
		color: rgba(21, 128, 61, 0.9);
	}

	.submit-message.error {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: rgba(153, 27, 27, 0.9);
	}

	.login-section {
		border-top: 1px solid rgba(173, 216, 230, 0.3);
		padding-top: 30px;
	}

	.login-section h3 {
		margin: 0 0 15px 0;
		color: rgba(70, 130, 180, 0.9);
		font-size: 1.2rem;
		font-weight: 500;
	}

	.login-description {
		color: rgba(70, 130, 180, 0.7);
		font-size: 0.9rem;
		line-height: 1.4;
		margin-bottom: 20px;
	}

	.google-login-button {
		width: 100%;
		padding: 15px;
		background: white;
		border: 1px solid rgba(173, 216, 230, 0.5);
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		color: rgba(70, 130, 180, 0.9);
	}

	.google-login-button:hover {
		background: rgba(248, 249, 250, 1);
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.user-section {
		border-top: 1px solid rgba(173, 216, 230, 0.3);
		padding-top: 30px;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 15px;
		margin-bottom: 20px;
	}

	.user-avatar {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgba(173, 216, 230, 0.3);
	}

	.user-details h3 {
		margin: 0;
		color: rgba(70, 130, 180, 0.9);
		font-size: 1.1rem;
		font-weight: 500;
	}

	.user-email {
		margin: 2px 0 0 0;
		color: rgba(70, 130, 180, 0.6);
		font-size: 0.9rem;
	}

	.logout-button {
		width: 100%;
		padding: 12px;
		background: rgba(239, 68, 68, 0.1);
		color: rgba(153, 27, 27, 0.9);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 12px;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.logout-button:hover {
		background: rgba(239, 68, 68, 0.15);
		transform: translateY(-1px);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 768px) {
		.title {
			font-size: 2rem;
			margin-bottom: 0.5rem;
		}

		.floating-message {
			font-size: 0.9rem;
			padding: 8px 16px;
			max-width: 250px;
		}

		.side-panel {
			width: 100vw;
		}

		.side-panel-trigger {
			right: 15px;
			width: 48px;
			height: 48px;
			padding: 12px;
		}
	}
</style>
