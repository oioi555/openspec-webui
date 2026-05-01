<script lang="ts">
  import { FileArchive, FolderPlus } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';
  import { OPENSPEC_INSTALL_DOCS_URL, OPENSPEC_SETUP_DOCS_URL } from '$lib/openspecDocs';
  import { layoutStore } from '$lib/state/layout.svelte.ts';
  import { FIXED_LABELS } from '$lib/uiText';
</script>

<div
  class="flex h-full w-full items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4"
>
  <div
    class="flex max-w-2xl flex-col gap-8 rounded-2xl border border-border/60 bg-card p-10 shadow-sm md:flex-row md:items-start md:gap-10"
  >
    <!-- Icon column -->
    <div class="flex-shrink-0">
      <div
        class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary md:h-20 md:w-20"
      >
        <FileArchive class="h-8 w-8 md:h-10 md:w-10" />
      </div>
    </div>

    <!-- Content column -->
    <div class="flex flex-col gap-6 text-left">
      <!-- Header section -->
      <div class="flex flex-col gap-3">
        <h2 class="text-3xl font-bold tracking-tight">{FIXED_LABELS.emptyProject.title}</h2>
        <p class="text-lg text-foreground/80">
          {t(m.empty_project_description)}
        </p>
      </div>

      <!-- Hint section -->
      <div class="border-t border-border/60 pt-5">
        <p class="text-sm leading-relaxed text-muted-foreground">
          {t(m.empty_project_init_hint)}
        </p>
      </div>

      <!-- Links section -->
      <div class="flex flex-col gap-2 text-sm">
        <span class="text-muted-foreground">{t(m.docs_intro)}</span>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <a
            class="font-medium text-primary underline underline-offset-4 transition-opacity hover:opacity-85"
            href={OPENSPEC_INSTALL_DOCS_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t(m.docs_install_label)}
          </a>
          <span aria-hidden="true" class="text-muted-foreground/50">·</span>
          <a
            class="font-medium text-primary underline underline-offset-4 transition-opacity hover:opacity-85"
            href={OPENSPEC_SETUP_DOCS_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t(m.docs_setup_label)}
          </a>
        </div>
      </div>

      <!-- CTA -->
      <Button
        size="lg"
        class="w-full shadow-lg shadow-primary/25"
        onclick={() => layoutStore.openOverlay('add-project')}
      >
        <FolderPlus class="mr-2 h-5 w-5" />
        {FIXED_LABELS.emptyProject.addProject}
      </Button>
    </div>
  </div>
</div>
