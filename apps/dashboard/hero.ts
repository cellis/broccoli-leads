// hero.ts - HeroUI Tailwind CSS plugin configuration
import { heroui } from '@heroui/react';

export default heroui({
  themes: {
    light: {
      colors: {
        background: '#fafafa',
        foreground: '#18181b',
        primary: {
          50: '#e6f7e6',
          100: '#c2ebc2',
          200: '#9bde9b',
          300: '#70d070',
          400: '#4ac54a',
          500: '#22c55e',
          600: '#1ea351',
          700: '#198043',
          800: '#145f35',
          900: '#0d3f24',
          DEFAULT: '#22c55e',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#22c55e',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
        },
        danger: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
      },
    },
    dark: {
      colors: {
        background: '#09090b',
        foreground: '#fafafa',
        primary: {
          50: '#0d3f24',
          100: '#145f35',
          200: '#198043',
          300: '#1ea351',
          400: '#22c55e',
          500: '#4ac54a',
          600: '#70d070',
          700: '#9bde9b',
          800: '#c2ebc2',
          900: '#e6f7e6',
          DEFAULT: '#22c55e',
          foreground: '#ffffff',
        },
      },
    },
  },
});
