import { createThemeStoreWithAdapter, loadTheme, type Theme } from './themeCore';

export type { Theme } from './themeCore';

export function createThemeStore() {
  let value = $state<Theme>(loadTheme());

  return createThemeStoreWithAdapter({
    get: () => value,
    set: (theme) => {
      value = theme;
    },
  });
}

export const themeStore = createThemeStore();
