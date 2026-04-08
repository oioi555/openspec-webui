<script lang="ts">
  import { Pin, PinOff, X } from '@lucide/svelte';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import * as Tabs from '$lib/components/ui/tabs';
  import { tabStore } from '../../stores/tabs.svelte.ts';

  function closeTab(event: MouseEvent, tabId: string) {
    event.stopPropagation();
    tabStore.close(tabId);
  }

  function togglePin(event: MouseEvent, tabId: string, pinned: boolean) {
    event.stopPropagation();

    if (pinned) {
      tabStore.unpin(tabId);
      return;
    }

    tabStore.pin(tabId);
  }
</script>

<div class="border-b border-border bg-card">
  <ScrollArea.Root class="w-full" orientation="horizontal" viewportClass="h-full">
    <Tabs.Root value={tabStore.activeTabId} onValueChange={(value) => tabStore.focus(value)}>
      <Tabs.List class="h-auto min-w-full justify-start gap-2 rounded-none bg-transparent p-2">
        {#each tabStore.tabs as tab, index}
          <div
            class={`flex items-stretch gap-1 rounded-lg border px-1 py-1 transition-colors ${tabStore.activeTabId === tab.id
              ? 'border-primary/50 bg-primary/10'
              : 'border-border/70 bg-secondary/40'} ${tab.pinned && tabStore.tabs[index + 1] && !tabStore.tabs[index + 1].pinned ? 'mr-3' : ''}`}
          >
            <Tabs.Trigger value={tab.id} class="max-w-48 bg-transparent px-3 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              <span class="truncate">{tab.name}</span>
            </Tabs.Trigger>

              <button
                type="button"
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label={tab.pinned ? 'Unpin tab' : 'Pin tab'}
                onclick={(event) => togglePin(event, tab.id, tab.pinned ?? false)}
              >
              {#if tab.pinned}
                <PinOff class="h-4 w-4" />
              {:else}
                <Pin class="h-4 w-4" />
              {/if}
            </button>

            {#if !tab.pinned}
              <button
                type="button"
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="Close tab"
                onclick={(event) => closeTab(event, tab.id)}
              >
                <X class="h-4 w-4" />
              </button>
            {/if}
          </div>
        {/each}
      </Tabs.List>
    </Tabs.Root>
  </ScrollArea.Root>
</div>
