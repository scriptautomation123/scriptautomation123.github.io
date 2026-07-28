const stored = localStorage.getItem('theme');
const preferredDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = stored === 'dark' || stored === 'light' ? stored : 'dark'; // Default to dark
document.documentElement.setAttribute('data-theme', theme);
