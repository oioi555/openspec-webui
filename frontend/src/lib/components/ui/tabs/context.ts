import { getContext, setContext } from 'svelte';

export interface TabsContext {
  getValue: () => string;
  setValue: (value: string) => void;
}

const TABS_CONTEXT = Symbol('tabs');

export function setTabsContext(context: TabsContext) {
  setContext(TABS_CONTEXT, context);
}

export function getTabsContext() {
  return getContext<TabsContext>(TABS_CONTEXT);
}
