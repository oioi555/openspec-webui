<script lang="ts">
  import {
    initializeData,
    setupWebSocket,
    toasts,
  } from './stores/index.svelte.ts';
  import { commandPreferencesStore } from './stores/commandPreferences.svelte.ts';
  import { themeStore } from './stores/theme.svelte.ts';
  import AppLayout from './components/layout/AppLayout.svelte';
  import Toast from './components/Toast.svelte';

  $effect(() => {
    themeStore.initialize();

    void initializeData();
    void commandPreferencesStore.initialize();
    const unsubscribe = setupWebSocket();

    return () => {
      unsubscribe();
      themeStore.destroy();
    };
  });
</script>

<div class="h-screen overflow-hidden bg-background text-foreground">
  <AppLayout />

  <!-- Toast notifications -->
  <div class="fixed bottom-4 right-4 space-y-2">
    {#each toasts.value as toast (toast.id)}
      <Toast message={toast.message} type={toast.type} />
    {/each}
  </div>
</div>
