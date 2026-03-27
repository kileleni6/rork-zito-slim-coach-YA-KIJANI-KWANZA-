export interface ThemeColors {
  background: string;
  cardDark: string;
  card: string;
  cardElevated: string;
  border: string;
  borderLight: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  accentFaint: string;
  accentGlow: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  danger: string;
  warning: string;
  success: string;
  orange: string;
  blue: string;
  purple: string;
  pink: string;
}

export const darkColors: ThemeColors = {
  background: '#0A0A0A',
  cardDark: '#141414',
  card: '#1A1A1A',
  cardElevated: '#242424',
  border: '#2A2A2A',
  borderLight: '#333333',
  accent: '#00D4AA',
  accentDark: '#00A884',
  accentLight: '#33DDBB',
  accentFaint: 'rgba(0, 212, 170, 0.08)',
  accentGlow: 'rgba(0, 212, 170, 0.15)',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#5A5A5E',
  danger: '#FF453A',
  warning: '#FFD60A',
  success: '#30D158',
  orange: '#FF9F0A',
  blue: '#0A84FF',
  purple: '#BF5AF2',
  pink: '#FF375F',
};

export const lightColors: ThemeColors = {
  background: '#F2F2F7',
  cardDark: '#E5E5EA',
  card: '#FFFFFF',
  cardElevated: '#F5F5F7',
  border: '#D1D1D6',
  borderLight: '#C7C7CC',
  accent: '#00A884',
  accentDark: '#008868',
  accentLight: '#00C99A',
  accentFaint: 'rgba(0, 168, 132, 0.08)',
  accentGlow: 'rgba(0, 168, 132, 0.12)',
  textPrimary: '#1C1C1E',
  textSecondary: '#6C6C70',
  textTertiary: '#AEAEB2',
  danger: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  orange: '#FF9500',
  blue: '#007AFF',
  purple: '#AF52DE',
  pink: '#FF2D55',
};

const Colors = darkColors;
export default Colors;
