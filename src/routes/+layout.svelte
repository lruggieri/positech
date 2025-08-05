<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		// Unregister any existing service worker to prevent caching issues
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.getRegistrations().then(function(registrations) {
				for(let registration of registrations) {
					registration.unregister();
					console.log('Service worker unregistered');
				}
			});
		}
	});
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>Positech - Share Positive Messages & Affirmations</title>
	<meta name="title" content="Positech - Share Positive Messages & Affirmations" />
	<meta name="description" content="Share positive messages and affirmations with the world. Create floating inspirational quotes and join a global community spreading positivity." />
	<meta name="keywords" content="positive messages, affirmations, motivation, inspiration, wellness, mental health, positivity, global community, floating messages, echoes, mindfulness, self-care, encouragement" />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://positech.org/" />
	<meta property="og:title" content="Positech - Share Positive Messages & Affirmations" />
	<meta property="og:description" content="Share positive messages and affirmations with the world. Create floating inspirational quotes and join a global community spreading positivity." />
	<meta property="og:image" content="https://positech.org/favicon.svg" />
	<meta property="og:image:alt" content="Positech - Beautiful floating positive messages and affirmations" />
	<meta property="og:site_name" content="Positech" />
	<meta property="og:locale" content="en_US" />
	
	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://positech.org/" />
	<meta property="twitter:title" content="Positech - Share Positive Messages & Affirmations" />
	<meta property="twitter:description" content="Share positive messages and affirmations with the world. Create floating inspirational quotes and join a global community spreading positivity." />
	<meta property="twitter:image" content="https://positech.org/favicon.svg" />
	<meta property="twitter:image:alt" content="Positech - Beautiful floating positive messages and affirmations" />
	
	<!-- Additional SEO Meta Tags -->
	<meta name="theme-color" content="#4682B4" />
	<meta name="msapplication-TileColor" content="#4682B4" />
	<meta name="application-name" content="Positech" />
	<meta name="apple-mobile-web-app-title" content="Positech" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	
	<!-- Performance optimizations -->
	<link rel="dns-prefetch" href="//positech.org" />
	<meta name="format-detection" content="telephone=no" />
	
	<!-- Favicon and Icons -->
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="manifest" href="/site.webmanifest" />
</svelte:head>

<main>
	<slot />
</main>