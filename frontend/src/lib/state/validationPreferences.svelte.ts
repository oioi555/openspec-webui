import {
  createValidationPreferencesStoreWithAdapter,
  loadValidationPreferences,
  type ValidationPreferences,
} from './validationPreferencesCore';

export type { ValidationPreferences, ValidationRequestOptions } from './validationPreferencesCore';

export function createValidationPreferencesStore() {
  let value = $state<ValidationPreferences>(loadValidationPreferences());

  return createValidationPreferencesStoreWithAdapter({
    get: () => value,
    set: (preferences) => {
      value = preferences;
    },
  });
}

export const validationPreferencesStore = createValidationPreferencesStore();
