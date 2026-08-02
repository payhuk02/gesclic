import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  hexToHslComponents,
  applyClinicBrandColor,
  resetClinicBrandColor,
  getStoredLocale,
  setStoredLocale,
  BRAND_COLOR_PRESETS,
  LOCALE_STORAGE_KEY,
} from '@/lib/clinic-branding';

function mockLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  });
}

describe('clinic-branding', () => {
  beforeEach(() => {
    mockLocalStorage();
    resetClinicBrandColor();
    localStorage.clear();
  });

  afterEach(() => {
    resetClinicBrandColor();
    document.documentElement.lang = 'fr';
  });

  it('converts Gesclic blue hex to HSL components', () => {
    expect(hexToHslComponents('#0EA5E9')).toBe('199 89% 48%');
  });

  it('rejects invalid hex values', () => {
    expect(hexToHslComponents('not-a-color')).toBeNull();
    expect(hexToHslComponents('#ABC')).toBeNull();
  });

  it('applies and resets CSS brand color variables', () => {
    applyClinicBrandColor('#10B981');
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('160 84% 39%');

    resetClinicBrandColor();
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('');
  });

  it('stores and reads locale preference', () => {
    expect(getStoredLocale()).toBe('fr');

    setStoredLocale('en');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    expect(getStoredLocale()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('exposes five brand color presets', () => {
    expect(BRAND_COLOR_PRESETS).toHaveLength(5);
    expect(BRAND_COLOR_PRESETS[0].hex).toBe('#0EA5E9');
  });
});
