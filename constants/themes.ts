import type { Theme } from '@/types';

export const THEMES: Record<string, Theme> = {
  nightrider: { id: 'nightrider', label: 'Night Rider', emoji: '🌑', bg: '#0a0a0a', surface: '#141414', accent: '#e94560', text: '#ffffff', muted: '#888888' },
  asphalt:    { id: 'asphalt',    label: 'Asphalt',     emoji: '🔥', bg: '#111111', surface: '#1c1c1e', accent: '#FF6B00', text: '#ffffff', muted: '#999999' },
  chrome:     { id: 'chrome',     label: 'Chrome',      emoji: '💎', bg: '#0a0d14', surface: '#111928', accent: '#58e6d9', text: '#e6edf3', muted: '#8b949e' },
  sunset:     { id: 'sunset',     label: 'Sunset',      emoji: '🌅', bg: '#1a0c00', surface: '#2d1a00', accent: '#ffb347', text: '#fff8ee', muted: '#c4905a' },
  storm:      { id: 'storm',      label: 'Storm',       emoji: '⚡', bg: '#1e2d3d', surface: '#253d52', accent: '#4dabf7', text: '#ffffff', muted: '#a3c4d6' },
  desert:     { id: 'desert',     label: 'Desert',      emoji: '🌵', bg: '#2c1a0e', surface: '#3d2511', accent: '#e8b06b', text: '#f5e6d3', muted: '#c4a57b' },
};

export const DEFAULT_THEME_ID = 'nightrider';
