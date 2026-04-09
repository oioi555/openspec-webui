<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { cn } from '$lib/utils';

  type UnderlineTab = {
    id: string;
    label: string;
    badge?: number | string;
  };

  interface Props {
    tabs: UnderlineTab[];
    activeId: string;
    onSelect?: (id: string) => void;
    class?: string;
    [key: string]: unknown;
  }

  let { tabs, activeId, onSelect = () => {}, class: className = '', ...restProps }: Props = $props();

  function handleKeydown(event: KeyboardEvent, index: number) {
    let nextIndex = index;

    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    onSelect(tabs[nextIndex].id);

    const button = (event.currentTarget as HTMLButtonElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex];
    button?.focus();
  }
</script>

<div
  {...restProps}
  role="tablist"
  class={cn('flex items-end gap-4 border-b border-border', className)}
>
  {#each tabs as tab, index (tab.id)}
    <button
      type="button"
      role="tab"
      tabindex={tab.id === activeId ? 0 : -1}
      aria-selected={tab.id === activeId}
      class={cn(
        'inline-flex items-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        tab.id === activeId
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
      )}
      onkeydown={(event) => handleKeydown(event, index)}
      onclick={() => onSelect(tab.id)}
    >
      <span>{tab.label}</span>

      {#if tab.badge !== undefined}
        <Badge
          variant="secondary"
          class={cn('min-w-5 justify-center px-1.5 py-0 text-[10px] leading-5', tab.id === activeId && 'bg-primary/10 text-primary')}
        >
          {tab.badge}
        </Badge>
      {/if}
    </button>
  {/each}
</div>
