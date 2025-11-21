/**
 * Ensemble Theme System
 * "Chaleureux & Éditorial Chic"
 * 
 * This file documents the custom theme and provides utilities
 * for future theme switching functionality.
 */

export type ThemeMode = 'light' | 'dark';

/**
 * Color Palette - "Pastel Chaleureux"
 */
export const ensembleTheme = {
    light: {
        // Background & Surfaces
        background: {
            name: "Crème d'Avoine",
            hex: "#FDF8F0",
            hsl: "37 71% 96%",
            usage: "Main background, large areas"
        },
        foreground: {
            name: "Marron Glacé",
            hex: "#705E52",
            hsl: "22 16% 40%",
            usage: "Primary text color"
        },

        // Action Colors
        primary: {
            name: "Vert Forêt Clair",
            hex: "#95B89B",
            hsl: "131 23% 66%",
            usage: "Action buttons, active icons, primary CTAs"
        },
        secondary: {
            name: "Jaune Soleil",
            hex: "#EBD399",
            hsl: "45 62% 76%",
            usage: "Notifications, reminder indicators"
        },
        destructive: {
            name: "Rouge Brique",
            hex: "#B07D6C",
            hsl: "14 33% 56%",
            usage: "Alerts, errors (use sparingly)"
        }
    },

    dark: {
        background: {
            name: "Gris Ardoise",
            hex: "#2A2F33",
            hsl: "200 9% 18%",
            usage: "Main dark background"
        },
        foreground: {
            name: "Blanc Cassé",
            hex: "#EDE5DC",
            hsl: "37 30% 90%",
            usage: "Primary text in dark mode"
        },
        primary: {
            name: "Vert Menthe",
            hex: "#B9D4BF",
            hsl: "131 27% 78%",
            usage: "Action buttons in dark mode"
        },
        secondary: {
            name: "Jaune Pâle",
            hex: "#FBE9B9",
            hsl: "45 89% 85%",
            usage: "Notifications in dark mode"
        },
        destructive: {
            name: "Corail Doux",
            hex: "#D7998D",
            hsl: "14 50% 70%",
            usage: "Alerts in dark mode"
        }
    }
} as const;

/**
 * Member Role Colors
 * Pastel/earthy tones to maintain warm ambiance
 */
export const memberColors = {
    parentA: {
        name: "Brun Cacao",
        hex: "#A17A6C",
        hsl: "17 23% 52%",
        usage: "Parent A (Fawsy) - avatars, event borders"
    },
    parentB: {
        name: "Bleu Gris",
        hex: "#8EA8AE",
        hsl: "190 16% 62%",
        usage: "Parent B - avatars, event borders"
    },
    child1: {
        name: "Vert Olive",
        hex: "#B0C99A",
        hsl: "92 32% 70%",
        usage: "Child 1 (Abel) - avatars, event borders"
    },
    child2: {
        name: "Rose Ancien",
        hex: "#CDA8A8",
        hsl: "0 28% 73%",
        usage: "Child 2 (Ismael) - avatars, event borders"
    }
} as const;

/**
 * Typography System
 */
export const typography = {
    heading: {
        font: "Cormorant Garamond",
        weight: 700,
        usage: "H1 only - major section titles (e.g., 'Bonjour Fawsy!', 'Paramètres')"
    },
    ui: {
        font: "Outfit",
        weight: 600,
        usage: "Card titles, subtitles, button labels, navigation"
    },
    body: {
        font: "Cabin",
        weights: [400, 500],
        usage: "Dates, descriptions, list text, body copy"
    }
} as const;

/**
 * Spacing System
 * Based on 8px grid
 */
export const spacing = {
    xs: "8px",    // 1 unit
    sm: "16px",   // 2 units - internal padding
    md: "24px",   // 3 units - section spacing
    lg: "32px",   // 4 units
    xl: "48px",   // 6 units
} as const;

/**
 * Border Radius
 */
export const borderRadius = {
    card: "12px",      // Main cards
    button: "100px",   // Pill buttons (max height)
    input: "8px",      // Form inputs
    large: "16px",     // Large containers
} as const;

/**
 * Utility: Get theme mode from system or user preference
 * @future Implement with localStorage/context when adding theme switcher
 */
export function getThemeMode(): ThemeMode {
    if (typeof window === 'undefined') return 'light';

    // Check for saved preference
    const saved = localStorage.getItem('theme-mode') as ThemeMode;
    if (saved) return saved;

    // Fallback to system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
}

/**
 * Utility: Apply theme mode
 * @future Use this when implementing theme switcher
 */
export function setThemeMode(mode: ThemeMode) {
    if (typeof window === 'undefined') return;

    localStorage.setItem('theme-mode', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
}
