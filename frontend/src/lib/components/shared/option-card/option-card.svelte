<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    icon: Component<{ class?: string }>;
    label: string;
    selected: boolean;
    name: string;
    value: string;
    description?: Snippet;
    class?: string;
    onchange?: (event: Event) => void;
    [key: string]: unknown;
  }

  let {
    icon: Icon,
    label,
    selected,
    name,
    value,
    description,
    class: className = '',
    onchange,
    ...restProps
  }: Props = $props();
</script>

<label
  {...restProps}
  data-slot="option-card"
  class={cn(
    'group relative flex cursor-pointer flex-col items-center gap-3 rounded-md border-2 bg-card p-4 text-center transition-colors hover:border-primary/50',
    selected ? 'border-primary bg-primary/5' : 'border-border',
    className,
  )}
>
  <input type="radio" {name} {value} class="sr-only" checked={selected} {onchange} />
  <div
    class="rounded-md bg-background p-3 transition-colors group-hover:bg-secondary/60"
  >
    <Icon class="h-6 w-6 text-foreground" />
  </div>
  <div class="space-y-1">
    <div class="font-medium text-foreground">{label}</div>
    {#if description}
      <div class="text-xs text-muted-foreground">
        {@render description()}
      </div>
    {/if}
  </div>
</label>
