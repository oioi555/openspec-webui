<script lang="ts">
  import { cn } from '$lib/utils';
  import { getSheetContext } from './context';

  interface Props {
    class?: string;
    closeOnClick?: boolean;
    [key: string]: unknown;
  }

  let { class: className = '', closeOnClick = true, ...restProps }: Props = $props();
  const sheet = getSheetContext();
</script>

{#if sheet.isOpen()}
  <button
    {...restProps}
    type="button"
    aria-label="Close sheet"
    class={cn('fixed inset-0 z-40 bg-overlay', className)}
    onclick={() => closeOnClick && sheet.setOpen(false)}
  ></button>
{/if}
