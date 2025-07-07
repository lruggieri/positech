<script lang="ts">
	import { onMount } from 'svelte';

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

	const positiveMessages = [
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

	function getRandomMessage(): string {
		return positiveMessages[Math.floor(Math.random() * positiveMessages.length)];
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
		for (let i = 0; i < maxMessages; i++) {
			messages.push(createMessage());
		}
		updateMessages();

		return () => {
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
		};
	});
</script>

<main>
	<h1 class="title">Echoes</h1>

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

	@media (max-width: 768px) {
		.title {
			font-size: 2.5rem;
		}

		.floating-message {
			font-size: 0.9rem;
			padding: 8px 16px;
			max-width: 250px;
		}
	}
</style>
