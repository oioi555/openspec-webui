<script lang="ts">
  import { AlertTriangle } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';

  interface Props {
    error: string;
    onRetry?: () => void;
    class?: string;
    [key: string]: unknown;
  }

  let { error, onRetry, class: className = '', ...restProps }: Props = $props();
</script>

<div
  {...restProps}
  role="alert"
  class={cn('rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-danger', className)}
>
  <div class="flex items-start gap-3">
    <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />

    <div class="min-w-0 flex-1">
      <div class="font-medium">Error</div>
      <p class="mt-1 text-sm">{error}</p>

      {#if onRetry}
        <div class="mt-3">
          <Button variant="destructive" size="sm" onclick={onRetry}>Retry</Button>
        </div>
      {/if}
    </div>
  </div>
</div>
