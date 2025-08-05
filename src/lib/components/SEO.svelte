<script lang="ts">
	interface SEOProps {
		title?: string;
		description?: string;
		url?: string;
		image?: string;
		type?: string;
		keywords?: string;
		author?: string;
		publishedTime?: string;
		modifiedTime?: string;
	}

	let {
		title = 'Positech - Echoes of Positivity | Share Inspiring Messages Worldwide',
		description = 'Discover and share positive messages from around the world. Watch beautiful floating affirmations, create your own inspiring echoes, and join a global community spreading positivity and wellness.',
		url = 'https://positech.org',
		image = 'https://positech.org/favicon.svg',
		type = 'website',
		keywords = 'positive messages, affirmations, motivation, inspiration, wellness, mental health, positivity, global community',
		author = 'Positech',
		publishedTime,
		modifiedTime
	}: SEOProps = $props();

	const fullTitle = title;
	const fullDescription = description;
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{fullTitle}</title>
	<meta name="title" content={fullTitle} />
	<meta name="description" content={fullDescription} />
	<meta name="keywords" content={keywords} />
	<meta name="author" content={author} />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={type} />
	<meta property="og:url" content={url} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={fullDescription} />
	<meta property="og:image" content={image} />
	<meta property="og:image:alt" content="Positech - Beautiful floating positive messages and affirmations" />
	<meta property="og:site_name" content="Positech" />
	<meta property="og:locale" content="en_US" />
	
	{#if publishedTime}
		<meta property="article:published_time" content={publishedTime} />
	{/if}
	
	{#if modifiedTime}
		<meta property="article:modified_time" content={modifiedTime} />
	{/if}
	
	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={url} />
	<meta property="twitter:title" content={fullTitle} />
	<meta property="twitter:description" content={fullDescription} />
	<meta property="twitter:image" content={image} />
	<meta property="twitter:image:alt" content="Positech - Beautiful floating positive messages and affirmations" />
	
	<!-- Canonical URL -->
	<link rel="canonical" href={url} />
</svelte:head>