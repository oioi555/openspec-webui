<script lang="ts">
  import { untrack } from 'svelte';
  import {
    initializeData,
    setupWebSocket,
  } from '$lib/state/appData.svelte.ts';
  import { localeStore } from '$lib/state/locale.svelte.ts';
  import { commandPreferencesStore } from '$lib/state/commandPreferences.svelte.ts';
  import { themeStore } from '$lib/state/theme.svelte.ts';
  import { uiPreferencesStore } from '$lib/state/uiPreferences.svelte.ts';
  import { versionStatusStore } from '$lib/state/versionStatus.svelte.ts';
  import AppLayout from '$lib/components/layout/AppLayout.svelte';
  import { Toaster } from '$lib/components/ui/sonner';

  $effect(() => {
    return untrack(() => {
      let disposed = false;
      let unsubscribe = () => {};

      if (!localeStore.initialized) {
        localeStore.initialize();
      }

      themeStore.initialize();
      uiPreferencesStore.initialize();
      void commandPreferencesStore.initialize();
      versionStatusStore.initialize();

      void (async () => {
        await initializeData();

        if (disposed) {
          return;
        }

        unsubscribe = setupWebSocket();
      })();

      return () => {
        disposed = true;
        unsubscribe();
        themeStore.destroy();
        versionStatusStore.destroy();
      };
    });
  });
</script>

<div class="h-screen overflow-hidden bg-background text-foreground">
  <AppLayout />
  <Toaster position="bottom-right" duration={3000} />
</div>
