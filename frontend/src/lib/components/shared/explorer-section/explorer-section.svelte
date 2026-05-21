<script lang="ts">
  import { ChevronDown, ChevronRight } from '@lucide/svelte';
  import type { Component, Snippet } from 'svelte';
  import { Badge } from '$lib/components/ui/badge';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import { EmptyState } from '$lib/components/shared/empty-state';
  import { layoutStore, type ExplorerSection } from '$lib/state/layout.svelte.ts';
  import { cn } from '$lib/utils';

  type IconComponent = Component<{ class?: string }>;

  interface Props {
    title: string;
    count: number;
    section?: ExplorerSection;
    open?: boolean;
    focused?: boolean;
    onToggle?: () => void;
    icon?: IconComponent;
    headerRight?: Snippet;
    headerExtra?: Snippet;
    emptyMessage?: string;
    emptyIcon?: IconComponent;
    children?: Snippet;
    class?: string;
    [key: string]: unknown;
  }

  let {
    title,
    count,
    section = undefined,
    open: openProp = undefined,
    focused: focusedProp = undefined,
    onToggle: onToggleProp = undefined,
    icon = undefined,
    headerRight,
    headerExtra,
    emptyMessage = undefined,
    emptyIcon = undefined,
    children,
    class: className = '',
    ...restProps
  }: Props = $props();

  let headerRef: HTMLDivElement | undefined = $state(undefined);
  let lastToggleScrollTime = $state(0);

  const resolvedEmptyIcon = $derived(emptyIcon ?? icon);

  const open = $derived(
    section
      ? !layoutStore.sectionCollapsed[section]
      : (openProp ?? true)
  );

  const focused = $derived(
    section
      ? layoutStore.focusedSection === section
      : (focusedProp ?? false)
  );

  // Scroll section header into view when focusedSection changes programmatically.
  // Guard against double-fire when handleToggle already scrolled.
  $effect(() => {
    const currentSection = section;
    const focusedSec = layoutStore.focusedSection;
    if (!currentSection || focusedSec !== currentSection || !open) return;

    // Skip if handleToggle just scrolled (< 150ms ago)
    if (Date.now() - lastToggleScrollTime < 150) return;

    requestAnimationFrame(() => {
      headerRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  function handleToggle(nextOpen?: boolean) {
    if (onToggleProp) {
      onToggleProp();
      return;
    }

    if (!section) return;

    const shouldOpen = nextOpen ?? layoutStore.sectionCollapsed[section];

    if (shouldOpen) {
      layoutStore.focusSection(section);
      lastToggleScrollTime = Date.now();
      requestAnimationFrame(() => {
        headerRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }

    layoutStore.setSectionCollapsed(section, true);
  }
</script>

<Collapsible.Root
  {...restProps}
  {open}
  onOpenChange={handleToggle}
  class={cn('bg-card', className)}
>
  <div
    bind:this={headerRef}
    class={cn(
      'relative scroll-mt-3 bg-secondary/30 px-3 py-2 transition-colors hover:bg-secondary/50',
      open && 'border-b border-border/70',
      focused && 'bg-primary/5'
    )}
  >
    <div
      aria-hidden="true"
      class={cn(
        'absolute inset-y-2 left-0 w-0.5 rounded-full bg-transparent transition-colors',
        focused && 'bg-primary'
      )}
    ></div>

    <div class="flex items-center gap-2">
      <Collapsible.Trigger class="flex min-w-0 flex-1 items-center gap-1.5 text-left">
        {#if icon}
          {@const Icon = icon}
          <Icon class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        {/if}

        <span class="truncate text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</span>

        <span class="ml-auto">
          <Badge variant="secondary" class="min-w-5 justify-center px-2 py-0.5 text-[11px] font-medium">
            {count}
          </Badge>
        </span>
      </Collapsible.Trigger>

      {#if headerRight}
        <div class="shrink-0">
          {@render headerRight()}
        </div>
      {/if}

      <button
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        onclick={() => handleToggle()}
        aria-label={open ? 'Collapse section' : 'Expand section'}
      >
        {#if open}
          <ChevronDown class="h-3.5 w-3.5" />
        {:else}
          <ChevronRight class="h-3.5 w-3.5" />
        {/if}
      </button>
    </div>

    {#if headerExtra && open}
      <div class="mt-2">
        {@render headerExtra()}
      </div>
    {/if}
  </div>

  <Collapsible.Content class="bg-card">
    {#if count === 0 && emptyMessage}
      <div class="border-b border-dashed border-border/50 bg-secondary/10">
        <EmptyState message={emptyMessage} icon={resolvedEmptyIcon} class="px-4 py-6" />
      </div>
    {:else}
      {@render children?.()}
    {/if}
  </Collapsible.Content>
</Collapsible.Root>
