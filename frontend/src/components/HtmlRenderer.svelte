<script lang="ts">
  interface Props {
    src: string;
    title?: string;
  }

  let { src, title = 'HTML Preview' }: Props = $props();

  let iframeHeight = $state(600);
  let iframe: HTMLIFrameElement;

  function handleLoad() {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        iframeHeight = Math.max(doc.body.scrollHeight + 40, 400);
      }
    } catch (e) {
      // Cross-origin, use default height
    }
  }
</script>

<div class="html-preview overflow-hidden rounded-lg border border-input">
  <div class="flex items-center justify-between bg-secondary px-4 py-2">
    <span class="text-sm text-card-foreground">{title}</span>
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      class="text-sm text-primary hover:underline"
    >
      Open in new tab
    </a>
  </div>
  <iframe
    bind:this={iframe}
    {src}
    title={title}
    sandbox="allow-scripts allow-same-origin"
    class="w-full bg-background"
    style="height: {iframeHeight}px; min-height: 400px; max-height: 80vh;"
    onload={handleLoad}
  ></iframe>
</div>

<style>
  .html-preview {
    background: var(--card);
  }
</style>
