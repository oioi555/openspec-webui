import { getContext, setContext } from 'svelte';

export interface SheetContext {
  isOpen: () => boolean;
  setOpen: (open: boolean) => void;
}

const SHEET_CONTEXT = Symbol('sheet');

export function setSheetContext(context: SheetContext) {
  setContext(SHEET_CONTEXT, context);
}

export function getSheetContext() {
  return getContext<SheetContext>(SHEET_CONTEXT);
}
