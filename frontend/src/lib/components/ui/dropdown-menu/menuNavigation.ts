/**
 * Menu keyboard navigation helpers.
 *
 * Pure index-math functions are exported for unit testing.
 * DOM-query wrappers use them internally.
 */

// ---------------------------------------------------------------------------
// Pure index logic (testable without DOM)
// ---------------------------------------------------------------------------

/** Return the next index, wrapping to 0. */
export function nextIndex(current: number, count: number): number {
  if (count === 0) return -1;
  return (current + 1) % count;
}

/** Return the previous index, wrapping to last. */
export function previousIndex(current: number, count: number): number {
  if (count === 0) return -1;
  return (current - 1 + count) % count;
}

/** Return 0 (first index). */
export function firstIndex(): number {
  return 0;
}

/** Return the last index. */
export function lastIndex(count: number): number {
  return count - 1;
}

/**
 * Return `true` if the tag+type combination is a text input where arrow keys
 * should move the caret instead of navigating menu items.
 */
export function isTextInputTag(tag: string, type?: string): boolean {
  if (tag === 'TEXTAREA') return true;
  if (tag === 'INPUT') {
    const t = type ?? '';
    return t === '' || t === 'text' || t === 'search' || t === 'email' || t === 'url' || t === 'password';
  }
  return false;
}

export type NavigationAction = 'arrow-nav' | 'home-end' | 'escape' | null;

/**
 * Decide what navigation action a keyboard event should trigger.
 *
 * @param key       The event key string.
 * @param targetTag tagName of the event target element.
 * @param targetType type attribute (for INPUT elements).
 */
export function resolveNavigationAction(
  key: string,
  targetTag: string,
  targetType?: string,
): NavigationAction {
  const isInput = isTextInputTag(targetTag, targetType);

  switch (key) {
    case 'ArrowDown':
      return isInput ? null : 'arrow-nav';
    case 'ArrowUp':
      return isInput ? null : 'arrow-nav';
    case 'Home':
      return isInput ? null : 'home-end';
    case 'End':
      return isInput ? null : 'home-end';
    case 'Escape':
      return 'escape';
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// DOM wrappers (thin, not unit-tested directly)
// ---------------------------------------------------------------------------

/** Return all enabled `[role=menuitem]` buttons inside `container`. */
export function getMenuItems(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>('button[role="menuitem"]:not([disabled])'),
  );
}

/** Return the index of the currently focused menuitem, or -1. */
export function getFocusedIndex(items: HTMLElement[]): number {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return -1;
  return items.indexOf(active);
}

/** Focus an item by index (no-op if index is out of range). */
export function focusItem(items: HTMLElement[], index: number): void {
  const clamped = Math.max(0, Math.min(index, items.length - 1));
  items[clamped]?.focus();
}

/** Focus the next item, wrapping. */
export function focusNext(items: HTMLElement[], current: number): void {
  focusItem(items, nextIndex(current, items.length));
}

/** Focus the previous item, wrapping. */
export function focusPrevious(items: HTMLElement[], current: number): void {
  focusItem(items, previousIndex(current, items.length));
}

/** Focus the first item. */
export function focusFirst(items: HTMLElement[]): void {
  focusItem(items, firstIndex());
}

/** Focus the last item. */
export function focusLast(items: HTMLElement[]): void {
  focusItem(items, lastIndex(items.length));
}

/**
 * Handle keyboard navigation inside a menu content container.
 *
 * Returns the action taken so the caller can decide whether to
 * `preventDefault` and/or close the menu.
 */
export function handleMenuKeydown(
  event: { key: string; preventDefault(): void; target: EventTarget | null },
  container: HTMLElement,
): NavigationAction {
  const target = event.target;
  const tag = target instanceof HTMLElement ? target.tagName : '';
  const type = target instanceof HTMLInputElement ? target.type : undefined;

  const action = resolveNavigationAction(event.key, tag, type);

  if (action === 'arrow-nav' || action === 'home-end') {
    event.preventDefault();
    const items = getMenuItems(container);
    const current = getFocusedIndex(items);

    switch (event.key) {
      case 'ArrowDown':
        if (current === -1) focusFirst(items);
        else focusNext(items, current);
        break;
      case 'ArrowUp':
        if (current === -1) focusLast(items);
        else focusPrevious(items, current);
        break;
      case 'Home':
        focusFirst(items);
        break;
      case 'End':
        focusLast(items);
        break;
    }
  }

  return action;
}
