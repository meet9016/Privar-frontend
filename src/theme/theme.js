export const lightTheme = {
  colors: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceSecondary: '#f1f5f9',
    card: '#ffffff',
    primary: '#4f46e5', // Indigo 600
    primaryHover: '#4338ca', // Indigo 700
    secondary: '#64748b', // Slate 500
    text: '#0f172a', // Slate 900
    textSecondary: '#475569', // Slate 600
    border: '#e2e8f0', // Slate 200
    success: '#10b981', // Emerald 500
    successBg: '#ecfdf5',
    successBorder: '#a7f3d0',
    successText: '#047857',
    warning: '#f59e0b', // Amber 500
    warningBg: '#fffbeb',
    warningBorder: '#fde68a',
    warningText: '#b45309',
    error: '#ef4444', // Red 500
    errorBg: '#fef2f2',
    errorBorder: '#fca5a5',
    errorText: '#b91c1c',
    info: '#3b82f6', // Blue 500
    infoBg: '#eff6ff',
    infoBorder: '#bfdbfe',
    infoText: '#1d4ed8',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    inputText: '#0f172a',
    glassBg: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(226, 232, 240, 0.8)',
    shadow: 'rgba(15, 23, 42, 0.05)',
    primaryGlow: 'rgba(79, 70, 229, 0.12)',
    successGlow: 'rgba(16, 185, 129, 0.12)',
    errorGlow: 'rgba(239, 68, 68, 0.12)',
  }
};

export const darkTheme = {
  colors: {
    background: '#0c1020',
    surface: '#0d1325',
    surfaceSecondary: '#111827',
    card: '#0d1325',
    primary: '#3b52f6',
    primaryHover: '#2535e8',
    secondary: '#94a3b8',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    border: 'rgba(255, 255, 255, 0.06)',
    success: '#10b981',
    successBg: 'rgba(16, 185, 129, 0.1)',
    successBorder: 'rgba(16, 185, 129, 0.2)',
    successText: '#34d399',
    warning: '#f59e0b',
    warningBg: 'rgba(245, 158, 11, 0.1)',
    warningBorder: 'rgba(245, 158, 11, 0.2)',
    warningText: '#fbbf24',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.1)',
    errorBorder: 'rgba(239, 68, 68, 0.2)',
    errorText: '#f87171',
    info: '#3b82f6',
    infoBg: 'rgba(59, 130, 246, 0.1)',
    infoBorder: 'rgba(59, 130, 246, 0.2)',
    infoText: '#60a5fa',
    inputBg: 'rgba(11, 15, 25, 0.4)',
    inputBorder: 'rgba(255, 255, 255, 0.08)',
    inputText: '#f8fafc',
    glassBg: 'rgba(15, 23, 42, 0.45)',
    glassBorder: 'rgba(255, 255, 255, 0.05)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    primaryGlow: 'rgba(59, 82, 246, 0.35)',
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
