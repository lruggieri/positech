import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface Theme {
	name: string;
	displayName: string;
	colors: {
		primary: string;
		primaryLight: string;
		primaryDark: string;
		text: string;
		background: string;
		messageBackground: string;
		messageBorder: string;
	};
}

export const themes: Record<string, Theme> = {
	blue: {
		name: 'blue',
		displayName: 'Ocean Blue',
		colors: {
			primary: 'rgba(70, 130, 180, 0.9)',
			primaryLight: 'rgba(173, 216, 230, 0.2)',
			primaryDark: 'rgba(70, 130, 180, 1)',
			text: 'rgba(70, 130, 180, 0.9)',
			background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
			messageBackground: 'rgba(173, 216, 230, 0.2)',
			messageBorder: 'rgba(173, 216, 230, 0.3)'
		}
	},
	pink: {
		name: 'pink',
		displayName: 'Rose Blush',
		colors: {
			primary: 'rgba(219, 112, 147, 0.9)',
			primaryLight: 'rgba(255, 182, 193, 0.2)',
			primaryDark: 'rgba(219, 112, 147, 1)',
			text: 'rgba(219, 112, 147, 0.9)',
			background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
			messageBackground: 'rgba(255, 182, 193, 0.2)',
			messageBorder: 'rgba(255, 182, 193, 0.3)'
		}
	},
	orange: {
		name: 'orange',
		displayName: 'Sunset Orange',
		colors: {
			primary: 'rgba(255, 140, 0, 0.9)',
			primaryLight: 'rgba(255, 218, 185, 0.2)',
			primaryDark: 'rgba(255, 140, 0, 1)',
			text: 'rgba(255, 140, 0, 0.9)',
			background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
			messageBackground: 'rgba(255, 218, 185, 0.2)',
			messageBorder: 'rgba(255, 218, 185, 0.3)'
		}
	},
	purple: {
		name: 'purple',
		displayName: 'Lavender Dream',
		colors: {
			primary: 'rgba(147, 112, 219, 0.9)',
			primaryLight: 'rgba(221, 160, 221, 0.2)',
			primaryDark: 'rgba(147, 112, 219, 1)',
			text: 'rgba(147, 112, 219, 0.9)',
			background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
			messageBackground: 'rgba(221, 160, 221, 0.2)',
			messageBorder: 'rgba(221, 160, 221, 0.3)'
		}
	}
};

function createThemeStore() {
	const defaultTheme = 'blue';
	const { subscribe, set, update } = writable<string>(defaultTheme);

	return {
		subscribe,
		setTheme: (themeName: string) => {
			if (themes[themeName]) {
				set(themeName);
				if (browser) {
					localStorage.setItem('theme', themeName);
					applyTheme(themes[themeName]);
				}
			}
		},
		init: () => {
			if (browser) {
				const saved = localStorage.getItem('theme');
				const themeToUse = saved && themes[saved] ? saved : defaultTheme;
				set(themeToUse);
				applyTheme(themes[themeToUse]);
			}
		}
	};
}

function applyTheme(theme: Theme) {
	if (!browser) return;

	const root = document.documentElement;
	const { colors } = theme;

	root.style.setProperty('--theme-primary', colors.primary);
	root.style.setProperty('--theme-primary-light', colors.primaryLight);
	root.style.setProperty('--theme-primary-dark', colors.primaryDark);
	root.style.setProperty('--theme-text', colors.text);
	root.style.setProperty('--theme-background', colors.background);
	root.style.setProperty('--theme-message-background', colors.messageBackground);
	root.style.setProperty('--theme-message-border', colors.messageBorder);
}

export const currentTheme = createThemeStore();