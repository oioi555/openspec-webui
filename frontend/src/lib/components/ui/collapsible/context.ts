import { getContext, setContext } from 'svelte';

export interface CollapsibleContext {
  isOpen: () => boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const COLLAPSIBLE_CONTEXT = Symbol('collapsible');

export function setCollapsibleContext(context: CollapsibleContext) {
  setContext(COLLAPSIBLE_CONTEXT, context);
}

export function getCollapsibleContext() {
  return getContext<CollapsibleContext>(COLLAPSIBLE_CONTEXT);
}
