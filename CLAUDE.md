# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit application called "positive.tech" that displays floating positive messages across the screen. The app creates an animated background with positive affirmations that fade in and move across the viewport.

**IMPORTANT: The production domain is positech.org, not positive.tech. Always use positech.org for all URLs, canonical links, and SEO references.**

## Architecture

- **Framework**: SvelteKit with TypeScript
- **Main Application**: Single-page application in `src/routes/+page.svelte`
- **Animation System**: Custom JavaScript animation using `requestAnimationFrame` for smooth 60fps movement
- **Styling**: CSS-in-JS approach with scoped styles and responsive design
- **State Management**: Svelte 5 `$state` runes for reactive message array
- **Database**: Redis for message storage and retrieval
- **AI Integration**: Gemini API for message filtering and validation

## Key Components

### Message System (`src/routes/+page.svelte`)

- **Message Interface**: Defines message properties including position, animation phase, and velocity
- **Animation Loop**: Continuous animation using `requestAnimationFrame` with constant velocity movement
- **Message Lifecycle**: Three phases - fade-in, visible, fade-out with 60-frame transitions
- **Dynamic Text Measurement**: Calculates message dimensions for proper positioning and collision detection
- **Message Sources**: Fetches messages from Redis with fallback to hardcoded messages

### API Endpoints

- **`/api/filter-message`**: POST endpoint that filters user-submitted messages using Gemini API
- **`/api/messages`**: GET endpoint that retrieves random messages from Redis storage

### Redis Integration (`src/lib/redis.ts`)

- **Message Storage**: Stores approved messages as JSON objects with metadata
- **Random Picker**: Implements random multi-cached picker using Redis `SRANDMEMBERCOUNT`
- **Fallback System**: Provides hardcoded fallback messages when Redis is unavailable

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check

# Type checking with file watching
npm run check:watch

# Lint and format code
npm run lint
npm run format
```

## Code Quality Tools

- **ESLint**: Code linting with Svelte-specific rules
- **Prettier**: Code formatting with Svelte plugin
- **TypeScript**: Type checking with `svelte-check`
- **Svelte Check**: Svelte-specific type checking and diagnostics

## Build Configuration

- **Vite**: Build tool and development server
- **Adapter**: Uses `@sveltejs/adapter-auto` for deployment flexibility
- **Preprocessing**: Vite preprocessing for TypeScript and CSS

## Key Development Patterns

- Uses Svelte 5 syntax with `$state` runes
- Implements smooth animations with constant velocity physics
- Responsive design with mobile-first approach
- Cleanup pattern for animation frames in `onMount` return function
- DOM measurement for dynamic text sizing
