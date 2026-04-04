<script lang="ts">
  import { archivedChanges, navigateTo } from '../stores/index';
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-100">Archived Changes</h1>
    <p class="text-gray-400 mt-1">Completed and archived change proposals</p>
  </div>

  <!-- Archived Changes -->
  <div class="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
    {#if $archivedChanges.length === 0}
      <div class="px-6 py-8 text-center text-gray-400">No archived changes</div>
    {:else}
      <div class="divide-y divide-gray-700">
        {#each $archivedChanges as change}
          <button
            class="w-full px-6 py-4 hover:bg-gray-700/50 text-left"
            onclick={() => navigateTo(`/changes/${change.name}`)}
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium text-gray-300">{change.name}</div>
                  {#if change.archivedDate}
                    <div class="text-sm text-gray-500">Archived: {change.archivedDate}</div>
                  {/if}
                </div>
              </div>
              <span class="px-2 py-1 text-xs bg-green-900 text-green-300 rounded">Completed</span>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
