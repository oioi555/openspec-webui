<script lang="ts">
  import type { Component } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  type IconComponent = Component<{ class?: string }>;

  interface Props extends HTMLButtonAttributes {
    label: string;
    title?: string;
    icon?: IconComponent;
    class?: string;
  }

  let {
    label,
    title = undefined,
    icon = undefined,
    type = 'button',
    class: className = '',
    ...restProps
  }: Props = $props();
</script>

<button
  {...restProps}
  {type}
  title={title}
  class={cn(
    'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent-border bg-accent-bg px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    className,
  )}
>
  {#if icon}
    {@const Icon = icon}
    <Icon class="h-3.5 w-3.5" />
  {/if}

  <span class="leading-none">{label}</span>
</button>
