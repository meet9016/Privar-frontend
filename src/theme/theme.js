export const lightTheme = {
  colors: {
    background: '#f8faff',
    surface: '#ffffff',
    surfaceSecondary: '#f1f5fb',
    card: '#ffffff',
    primary: '#4338ca', // Rich Indigo from Logo (#4338ca)
    primaryHover: '#3730a3', // Deep Royal Indigo
    secondary: '#475569',
    text: '#0b1120', // Deepest Navy
    textSecondary: '#475569',
    border: '#e2e8f0',
    success: '#10b981',
    successBg: '#ecfdf5',
    successBorder: '#a7f3d0',
    successText: '#047857',
    warning: '#f59e0b',
    warningBg: '#fffbeb',
    warningBorder: '#fde68a',
    warningText: '#b45309',
    error: '#ef4444',
    errorBg: '#fef2f2',
    errorBorder: '#fca5a5',
    errorText: '#b91c1c',
    info: '#3b82f6',
    infoBg: '#eff6ff',
    infoBorder: '#bfdbfe',
    infoText: '#1d4ed8',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    inputText: '#0b1120',
    glassBg: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(226, 232, 240, 0.9)',
    shadow: 'rgba(11, 17, 32, 0.06)',
    primaryGlow: 'rgba(67, 56, 202, 0.2)',
    successGlow: 'rgba(16, 185, 129, 0.15)',
    errorGlow: 'rgba(239, 68, 68, 0.15)',
  }
};

export const darkTheme = {
  colors: {
    background: '#070b14', // Deep Midnight Blue
    surface: '#0b1120', // Premium Navy Slate
    surfaceSecondary: '#11192e',
    card: '#0b1120',
    primary: '#6366f1', // Electric Indigo from Logo
    primaryHover: '#4f46e5',
    secondary: '#94a3b8',
    text: '#f8faff',
    textSecondary: '#94a3b8',
    border: 'rgba(255, 255, 255, 0.08)',
    success: '#10b981',
    successBg: 'rgba(16, 185, 129, 0.12)',
    successBorder: 'rgba(16, 185, 129, 0.25)',
    successText: '#34d399',
    warning: '#f59e0b',
    warningBg: 'rgba(245, 158, 11, 0.12)',
    warningBorder: 'rgba(245, 158, 11, 0.25)',
    warningText: '#fbbf24',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.12)',
    errorBorder: 'rgba(239, 68, 68, 0.25)',
    errorText: '#f87171',
    info: '#3b82f6',
    infoBg: 'rgba(59, 130, 246, 0.12)',
    infoBorder: 'rgba(59, 130, 246, 0.25)',
    infoText: '#60a5fa',
    inputBg: 'rgba(17, 25, 46, 0.6)',
    inputBorder: 'rgba(255, 255, 255, 0.1)',
    inputText: '#f8faff',
    glassBg: 'rgba(11, 17, 32, 0.75)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    shadow: 'rgba(0, 0, 0, 0.4)',
    primaryGlow: 'rgba(99, 102, 241, 0.35)',
    successGlow: 'rgba(16, 185, 129, 0.35)',
    errorGlow: 'rgba(239, 68, 68, 0.35)',
  }
};

export const activeTheme = 'light';

export const applyTheme = (themeName) => {
  const selectedTheme = themeName === 'dark' ? darkTheme : lightTheme;
  const root = document.documentElement;
  Object.entries(selectedTheme.colors).forEach(([key, value]) => {
    const cssKey = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssKey, value);
  });
};
