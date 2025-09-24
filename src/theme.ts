export type ThemeMode = 'light' | 'dark';

const MEDIA_QUERY = '(prefers-color-scheme: dark)';

export function detectSystemTheme(): ThemeMode {
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
}

export function watchSystemTheme(onChange: (theme: ThemeMode) => void): () => void {
  const media = window.matchMedia(MEDIA_QUERY);

  const handler = () => {
    onChange(media.matches ? 'dark' : 'light');
  };

  handler();

  media.addEventListener('change', handler);

  return () => media.removeEventListener('change', handler);
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}
