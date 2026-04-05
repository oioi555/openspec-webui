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

<div class="html-preview rounded-lg overflow-hidden border border-input-border">
  <div class="bg-input-bg px-4 py-2 flex items-center justify-between">
    <span class="text-sm text-on-surface">{title}</span>
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      class="text-sm text-brand hover:text-brand-hover"
    >
      Open in new tab
    </a>
  </div>
  <iframe
    bind:this={iframe}
    {src}
    title={title}
    sandbox="allow-scripts allow-same-origin"
    class="w-full bg-bg"
    style="height: {iframeHeight}px; min-height: 400px; max-height: 80vh;"
    onload={handleLoad}
  ></iframe>
</div>

<style>
  .html-preview {
    background: var(--surface);
  }
</style>
