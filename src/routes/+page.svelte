<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

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
	}

	let messages: Message[] = $state([]);
	let messageId = 0;
	let animationFrame: number;
	let sidePanelOpen = $state(false);
	let messageText = $state('');
	let isSubmitting = $state(false);
	let submitMessage = $state('');
	let submitMessageType: 'success' | 'error' | '' = $state('');
	let availableMessages: string[] = $state([]);

	const user = $derived(data.user);
	
	// Debug logging
	$effect(() => {
		console.log('User data:', user);
		console.log('Full data:', data);
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
					availableMessages = fallbackMessages;
				}
			} else {
				console.error('Failed to load messages from API');
				availableMessages = fallbackMessages;
			}
		} catch (error) {
			console.error('Error loading messages:', error);
			availableMessages = fallbackMessages;
		}
	}

	function getRandomMessage(): string {
		if (availableMessages.length === 0) {
			return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
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
		const text = getRandomMessage();
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
			velocityY: velocityY
		};
	}

	async function submitEcho() {
		if (!messageText.trim() || isSubmitting) return;
		
		isSubmitting = true;
		submitMessage = '';
		submitMessageType = '';

		try {
			const response = await fetch('/api/filter-message', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ message: messageText.trim() }),
			});

			const result = await response.json();

			if (!response.ok) {
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
				submitMessage = result.reason || 'Your message could not be shared. Please try a more positive message.';
				submitMessageType = 'error';
			}
		} catch (error) {
			console.error('Error submitting message:', error);
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
				method: 'POST',
			});
			// Reload the page to update the user state
			window.location.reload();
		} catch (error) {
			console.error('Logout error:', error);
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
				
				const nearScreenEdge = leftEdge < margin || 
									   rightEdge > window.innerWidth - margin ||
									   topEdge < margin || 
									   bottomEdge > window.innerHeight - margin;
				
				// Handle fade phases
				if (newMessage.phase === 'fade-in') {
					newMessage.fadeTimer += 1;
					if (newMessage.fadeTimer < 60) { // 60 frames to fade in
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
					if (newMessage.fadeTimer < 60) { // 60 frames to fade out
						newMessage.opacity = 1 - (newMessage.fadeTimer / 60);
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
	<h1 class="title">Echoes</h1>

	<button 
		class="side-panel-trigger" 
		onclick={() => sidePanelOpen = !sidePanelOpen}
		aria-label="Open side panel"
	>
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M12 5v14M5 12h14"/>
		</svg>
	</button>

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
			</div>
		{/each}
	</div>

	<div class="side-panel" class:open={sidePanelOpen}>
		<div class="side-panel-header">
			<h2>Add Your Echo</h2>
			<button 
				class="close-button" 
				onclick={() => sidePanelOpen = false}
				aria-label="Close side panel"
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12"/>
				</svg>
			</button>
		</div>

		<div class="side-panel-content">
			<div class="message-form-section">
				<h3>Share a positive message</h3>
				<textarea 
					bind:value={messageText}
					placeholder="Write your positive message here..."
					class="message-input"
					maxlength="150"
					rows="4"
				></textarea>
				<div class="character-count">{messageText.length}/150</div>
				<button 
					class="submit-button" 
					disabled={messageText.trim().length === 0 || isSubmitting}
					onclick={submitEcho}
				>
					{isSubmitting ? 'Sharing...' : 'Share Echo'}
				</button>
				
				{#if submitMessage}
					<div class="submit-message" class:success={submitMessageType === 'success'} class:error={submitMessageType === 'error'}>
						{submitMessage}
					</div>
				{/if}
			</div>

{#if !user}
			<div class="login-section">
				<h3>Login to share more</h3>
				<p class="login-description">
					Login to share up to 10 echoes per day and help spread positivity!
				</p>
				<a href="/api/auth/google" class="google-login-button">
					<svg width="20" height="20" viewBox="0 0 24 24">
						<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
				<button class="logout-button" onclick={logout}>
					Logout
				</button>
			</div>
			{/if}
		</div>
	</div>

	{#if sidePanelOpen}
		<div class="side-panel-overlay" onclick={() => sidePanelOpen = false}></div>
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		height: 100vh;
		overflow: hidden;
		background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	main {
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}

	.title {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 4rem;
		font-weight: 300;
		color: rgba(100, 150, 200, 0.8);
		text-align: center;
		margin: 0;
		z-index: 1;
		text-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
		letter-spacing: 0.1em;
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
		color: rgba(70, 130, 180, 0.9);
		font-size: 1.1rem;
		font-weight: 400;
		padding: 12px 20px;
		background: rgba(173, 216, 230, 0.2);
		border-radius: 25px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(173, 216, 230, 0.3);
		white-space: nowrap;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		transition: opacity 0.3s ease;
		max-width: 300px;
		text-align: center;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.side-panel-trigger {
		position: fixed;
		top: 50%;
		right: 20px;
		transform: translateY(-50%);
		z-index: 1000;
		background: rgba(173, 216, 230, 0.9);
		border: 1px solid rgba(173, 216, 230, 0.3);
		border-radius: 50%;
		padding: 15px;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
		color: rgba(70, 130, 180, 0.9);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		width: 54px;
		height: 54px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.side-panel-trigger:hover {
		background: rgba(173, 216, 230, 1);
		transform: translateY(-50%) scale(1.05);
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
			font-size: 2.5rem;
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
