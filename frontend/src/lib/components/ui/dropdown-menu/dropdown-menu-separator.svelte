<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    [key: string]: unknown;
  }

  let { class: className = '', ...restProps }: Props = $props();
</script>

<div {...restProps} role="separator" class={cn('-mx-1 my-1 h-px bg-border', className)}></div>
