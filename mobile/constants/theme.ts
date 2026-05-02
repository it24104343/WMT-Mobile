import { Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const baseColors = {
  primary: '#002855', // Deep Navy
  secondary: '#001a3d', // Darker Navy
  accent: '#3b82f6', // Bright Blue
  background: '#f1f5f9', // Light Blue Gray
  surface: '#ffffff', // Pure White
  text: '#1e293b', // Slate 800
  textMuted: '#64748b', // Slate 500
  border: '#e2e8f0', // Slate 200
  card: '#ffffff',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  white: '#ffffff',
  black: '#000000',
  navy: '#002855',
  lightBlue: '#dbeafe',
};

export const Colors = {
  ...baseColors,
  light: {
    ...baseColors,
    tint: baseColors.primary,
    tabIconDefault: '#94a3b8',
    tabIconSelected: baseColors.primary,
  },
  dark: {
    ...baseColors,
    tint: baseColors.primary,
    tabIconDefault: '#94a3b8',
    tabIconSelected: baseColors.primary,
  },
};

export const GRadients = {
  primary: ['#002855', '#001a3d'],
  blue: ['#3b82f6', '#2563eb'],
  navy: ['#002855', '#001a3d'],
  sky: ['#38bdf8', '#0ea5e9'],
  white: ['#ffffff', '#f8fafc'],
  success: ['#10b981', '#059669'],
  purple: ['#a855f7', '#9333ea'],
  orange: ['#f97316', '#ea580c'],
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 32,
  xxl: 40,
  round: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  }
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    rounded: 'System',
    mono: 'Courier',
  },
  default: {
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
  },
});
