// frontend/src/utils/themes.js
// Easy theme switching configuration

export const themes = {
  // Current: Light Green & White
  lightGreen: {
    name: 'Light Green',
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    gradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
  },

  // Alternative: Professional Blue & White
  blueWhite: {
    name: 'Professional Blue',
    primary: {
      50: '#eff6ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
  },

  // Alternative: Deep Purple & Gold
  purpleGold: {
    name: 'Premium Purple',
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    gradient: 'linear-gradient(135deg, #a855f7 0%, #6d28d9 100%)',
    accent: '#fbbf24', // Gold
  },

  // Alternative: Vibrant Orange & Coral
  orangeSlate: {
    name: 'Energetic Orange',
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
    accent: '#1e293b', // Slate
  },

  // Alternative: Indigo & Coral
  indigoCoral: {
    name: 'Modern Indigo',
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    accent: '#ef4444', // Coral
  },

  // Alternative: Slate & Cyan
  slateCyan: {
    name: 'Tech Slate',
    primary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    accent: '#06b6d4', // Cyan
  },
};

export const applyTheme = (themeName) => {
  const theme = themes[themeName];
  if (!theme) {
    console.error(`Theme "${themeName}" not found`);
    return;
  }
  
  // Store theme choice
  localStorage.setItem('selectedTheme', themeName);
  
  // Apply CSS variables for dynamic theming (optional advanced setup)
  Object.entries(theme.primary).forEach(([shade, color]) => {
    document.documentElement.style.setProperty(`--color-primary-${shade}`, color);
  });
};

export const getSelectedTheme = () => {
  return localStorage.getItem('selectedTheme') || 'lightGreen';
};
