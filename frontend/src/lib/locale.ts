export const LOCALE_STORAGE_KEY = 'openspec-locale';

export const SUPPORTED_LOCALES = ['en', 'ja', 'pt-BR', 'es', 'zh-CN', 'fr', 'de'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  ja: '日本語',
  'pt-BR': 'Português (Brasil)',
  es: 'Español',
  'zh-CN': '简体中文',
  fr: 'Français',
  de: 'Deutsch',
};

export const CLI_LANGUAGE_BY_LOCALE: Record<AppLocale, string> = {
  en: 'English',
  ja: 'Japanese',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  'pt-BR': 'Portuguese (pt-BR)',
  'zh-CN': 'Chinese (Simplified)',
};

export function buildArtifactLanguageInitCommand(locale: AppLocale): string {
  return `openspec init --language "${CLI_LANGUAGE_BY_LOCALE[locale]}"`;
}

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as AppLocale);
}

export function normalizeLocaleTag(value: string | null | undefined): AppLocale | null {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase().replace(/_/g, '-');

  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }

  if (normalized === 'ja' || normalized.startsWith('ja-')) {
    return 'ja';
  }

  if (normalized === 'pt-br' || normalized.startsWith('pt-')) {
    return 'pt-BR';
  }

  if (normalized === 'es' || normalized.startsWith('es-')) {
    return 'es';
  }

  if (normalized === 'zh-cn' || normalized.startsWith('zh-')) {
    return 'zh-CN';
  }

  if (normalized === 'fr' || normalized.startsWith('fr-')) {
    return 'fr';
  }

  if (normalized === 'de' || normalized.startsWith('de-')) {
    return 'de';
  }

  return null;
}

export function loadStoredLocale(): AppLocale | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    return normalizeLocaleTag(localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveStoredLocale(locale: AppLocale) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore storage errors.
  }
}

export function resolvePreferredLocale(): AppLocale {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];

  for (const candidate of candidates) {
    const locale = normalizeLocaleTag(candidate);
    if (locale) {
      return locale;
    }
  }

  return DEFAULT_LOCALE;
}

export function resolveBootstrapLocale(): AppLocale {
  return loadStoredLocale() ?? resolvePreferredLocale();
}

export function syncDocumentLocale(locale: AppLocale, direction: 'ltr' | 'rtl' = 'ltr') {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.setAttribute('lang', locale);
  document.documentElement.setAttribute('dir', direction);
}
