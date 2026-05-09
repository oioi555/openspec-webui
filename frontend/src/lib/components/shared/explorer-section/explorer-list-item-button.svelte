<script lang="ts">
  import type { Snippet } from "svelte";
  import { ItemContextMenu, type MenuItem } from "$lib/components/shared/item-context-menu";
  import { TypeIndicator } from "$lib/components/shared/type-indicator";
  import { cn } from "$lib/utils";
  import type { EntityKind } from "$lib/visualSemantics";

  interface Props {
    items: MenuItem[];
    kind: EntityKind;
    name: string;
    displayName?: string;
    active?: boolean;
    interactive?: boolean;
    class?: string;
    onclick?: (event: MouseEvent) => void;
    children?: Snippet;
  }

  let {
    items,
    kind,
    name,
    displayName,
    active = false,
    interactive = true,
    class: className = "",
    onclick,
    children,
  }: Props = $props();
</script>

<ItemContextMenu {items}>
  <button
    type="button"
    class={cn(
      "flex w-full flex-col gap-2 border-b border-border/50 px-3 py-3 text-left text-muted-foreground transition-colors",
      interactive
        ? "hover:bg-secondary/70 hover:text-foreground"
        : "cursor-default",
      className,
      active && "bg-primary/10 text-foreground",
    )}
    {onclick}
>
    <div class="flex w-full min-w-0 items-center gap-2">
      <TypeIndicator {kind} format="icon-box" size="sm" />
      <span
        class="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
        title={name}>{displayName ?? name}</span
      >
    </div>

    {@render children?.()}
  </button>
</ItemContextMenu>
