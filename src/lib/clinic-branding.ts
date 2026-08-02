/** Convert #RRGGBB to HSL components string for CSS vars: "199 89% 48%" */
export function hexToHslComponents(hex: string): string | null {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / delta) % 6;
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const BRAND_COLOR_VARS = [
  '--primary',
  '--ring',
  '--sidebar-primary',
  '--sidebar-ring',
  '--medical-blue',
] as const;

export function applyClinicBrandColor(hex: string | null | undefined): void {
  const root = document.documentElement;
  if (!hex) {
    resetClinicBrandColor();
    return;
  }

  const hsl = hexToHslComponents(hex);
  if (!hsl) return;

  for (const varName of BRAND_COLOR_VARS) {
    root.style.setProperty(varName, hsl);
  }
}

export function resetClinicBrandColor(): void {
  const root = document.documentElement;
  for (const varName of BRAND_COLOR_VARS) {
    root.style.removeProperty(varName);
  }
}

export const BRAND_COLOR_PRESETS = [
  { id: 'sky', label: 'Bleu Gesclic', hex: '#0EA5E9' },
  { id: 'emerald', label: 'Vert', hex: '#10B981' },
  { id: 'violet', label: 'Violet', hex: '#8B5CF6' },
  { id: 'amber', label: 'Ambre', hex: '#F59E0B' },
  { id: 'rose', label: 'Rose', hex: '#EF4444' },
] as const;

export const LOCALE_STORAGE_KEY = 'gesclic_locale';
export type AppLocale = 'fr' | 'en';

export function getStoredLocale(): AppLocale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === 'en' ? 'en' : 'fr';
}

export function setStoredLocale(locale: AppLocale): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}
