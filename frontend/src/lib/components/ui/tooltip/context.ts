import { getContext, setContext } from 'svelte';

export interface TooltipContext {
  isOpen: () => boolean;
  setOpen: (open: boolean) => void;
}

const TOOLTIP_CONTEXT = Symbol('tooltip');

export function setTooltipContext(context: TooltipContext) {
  setContext(TOOLTIP_CONTEXT, context);
}

export function getTooltipContext() {
  return getContext<TooltipContext>(TOOLTIP_CONTEXT);
}
