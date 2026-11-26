<script lang="ts">
  import { Folder, FolderOpen } from '@lucide/svelte';
  import { StatusIndicator } from '$lib/components/shared/status-indicator';
  import type { ValidationStatusKind } from '$lib/visualSemantics';

  interface Props {
    segment: string;
    path: string;
    count: number;
    expanded: boolean;
    validationStatus?: ValidationStatusKind | null;
    onToggle: () => void;
  }

  let { segment, path, count, expanded, validationStatus = null, onToggle }: Props = $props();
</script>

<button
  type="button"
  tabindex={-1}
  class="flex w-full min-w-0 items-center gap-2 border-b border-border/50 py-2.5 pl-1.5 pr-3 text-left text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
  title={path}
  onclick={onToggle}
>
  <span class="flex h-6 w-6 shrink-0 items-center justify-center">
    {#if expanded}
      <FolderOpen class="h-4 w-4" />
    {:else}
      <Folder class="h-4 w-4" />
    {/if}
  </span>
  <span class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{segment}</span>
  {#if validationStatus}
    <StatusIndicator state={validationStatus} format="minimal" showLabel={false} class="shrink-0" />
  {/if}
  <span class="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">{count}</span>
</button>
