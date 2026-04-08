import { getContext, setContext } from 'svelte';

export interface DropdownMenuContext {
  isOpen: () => boolean;
  setOpen: (open: boolean) => void;
  getTriggerElement: () => HTMLElement | null;
  setTriggerElement: (element: HTMLElement | null) => void;
  getContentElement: () => HTMLElement | null;
  setContentElement: (element: HTMLElement | null) => void;
}

const DROPDOWN_MENU_CONTEXT = Symbol('dropdown-menu');

export function setDropdownMenuContext(context: DropdownMenuContext) {
  setContext(DROPDOWN_MENU_CONTEXT, context);
}

export function getDropdownMenuContext() {
  return getContext<DropdownMenuContext>(DROPDOWN_MENU_CONTEXT);
}
