<script lang="ts">
  import { X } from '@lucide/svelte';
  import type { Component, Snippet } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';

  type IconComponent = Component<{ class?: string }>;

  interface Props {
    icon?: IconComponent;
    title: string;
    description?: string;
    onClose?: () => void;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    icon = undefined,
    title,
    description = '',
    onClose,
    class: className = '',
    children,
    ...restProps
  }: Props = $props();
</script>

<div
  {...restProps}
  class={cn('flex items-start justify-between gap-4 border-b border-border px-6 py-4', className)}
>
  <div class="min-w-0 flex items-start gap-3">
    {#if icon}
      {@const Icon = icon}
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon class="h-5 w-5" />
      </div>
    {/if}

    <div class="min-w-0">
      <h2 class="text-lg font-semibold text-foreground">{title}</h2>

      {#if description}
        <p class="mt-1 text-sm text-muted-foreground">{description}</p>
      {/if}

      {@render children?.()}
    </div>
  </div>

  {#if onClose}
    <Button variant="ghost" size="icon" aria-label="Close" onclick={onClose}>
      <X class="h-4 w-4" />
    </Button>
  {/if}
</div>
