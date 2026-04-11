import { getContext, setContext } from 'svelte';

export interface ContextMenuContext {
  isOpen: () => boolean;
  setOpen: (open: boolean) => void;
  getPosition: () => { x: number; y: number };
  setPosition: (x: number, y: number) => void;
}

const CONTEXT_MENU_CONTEXT = Symbol('context-menu');

export function setContextMenuContext(context: ContextMenuContext) {
  setContext(CONTEXT_MENU_CONTEXT, context);
}

export function getContextMenuContext() {
  return getContext<ContextMenuContext>(CONTEXT_MENU_CONTEXT);
}
