import { getContext, setContext } from 'svelte';

export interface DialogContext {
  isOpen: () => boolean;
  setOpen: (open: boolean) => void;
}

const DIALOG_CONTEXT = Symbol('dialog');

export function setDialogContext(context: DialogContext) {
  setContext(DIALOG_CONTEXT, context);
}

export function getDialogContext() {
  return getContext<DialogContext>(DIALOG_CONTEXT);
}
