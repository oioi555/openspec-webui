<script lang="ts">
  import type { Component } from 'svelte';
  import { cn } from '$lib/utils';

  type IconComponent = Component<{ class?: string }>;

  interface Props {
    message: string;
    icon?: IconComponent;
    class?: string;
    [key: string]: unknown;
  }

  let { message, icon = undefined, class: className = '', ...restProps }: Props = $props();
</script>

<div
  {...restProps}
  class={cn('flex flex-col items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground', className)}
>
  {#if icon}
    {@const Icon = icon}
    <Icon class="mb-3 h-10 w-10 opacity-50" />
  {/if}

  <p>{message}</p>
</div>
