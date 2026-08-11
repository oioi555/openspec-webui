<script lang="ts">
  import { ArrowRight } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { tabStore } from '$lib/state/tabs.svelte.ts';
  import { versionStatusStore } from '$lib/state/versionStatus.svelte.ts';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';

  type ToolBadge = {
    label: string;
    current: string | null;
    latest: string | null;
    updateAvailable: boolean;
  };

  let tools = $derived.by((): ToolBadge[] => {
    const snapshot = versionStatusStore.snapshot;
    if (!snapshot || snapshot.loading) return [];

    return [
      {
        label: t(m.settings_versions_webui_label),
        current: snapshot.tools.webui.currentVersion,
        latest: snapshot.tools.webui.latestVersion,
        updateAvailable: snapshot.tools.webui.updateAvailable,
      },
      {
        label: t(m.settings_versions_openspec_label),
        current: snapshot.tools.openspec.currentVersion,
        latest: snapshot.tools.openspec.latestVersion,
        updateAvailable: snapshot.tools.openspec.updateAvailable,
      },
    ];
  });

  function handleClick() {
    tabStore.openSettings({ initialSection: 'versions' });
  }
</script>

{#if tools.length > 0}
  <button type="button" onclick={handleClick} class="flex items-center gap-1.5">
    {#each tools as tool}
      <Badge
        variant={tool.updateAvailable ? 'warning' : 'outline'}
        class="cursor-pointer gap-0.5 text-[11px] hover:opacity-80 transition-opacity"
      >
        <span class="opacity-60">{tool.label}</span>
        {#if tool.updateAvailable}
          <span>{tool.current ?? '?'}</span>
          <ArrowRight class="h-2.5 w-2.5" />
          <span class="font-semibold">{tool.latest ?? '?'}</span>
        {:else}
          <span>v{tool.current ?? '?'}</span>
        {/if}
      </Badge>
    {/each}
  </button>
{/if}
