<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { class: className = '', children, ...restProps }: Props = $props();
</script>

<div
  {...restProps}
  data-slot="card"
  class={cn('bg-card text-card-foreground flex flex-col gap-6 rounded-lg border py-6 shadow', className)}
>
  {@render children?.()}
</div>
