<script lang="ts">
  interface Props {
    message: string;
    type?: 'info' | 'success' | 'error';
  }

  let { message, type = 'info' }: Props = $props();

  const colors = {
    info: 'bg-info-solid',
    success: 'bg-success-solid',
    error: 'bg-danger-solid',
  };
</script>

<div
  class="px-4 py-2 rounded-lg text-on-brand shadow-lg animate-fade-in {colors[type]}"
  role="alert"
>
  {message}
</div>

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
</style>
