<script lang="ts">
  interface Props {
    message: string;
    type?: 'info' | 'success' | 'error';
  }

  let { message, type = 'info' }: Props = $props();

  const colors = {
    info: 'bg-primary text-primary-foreground',
    success: 'bg-success-solid text-white',
    error: 'bg-danger-solid text-white',
  };
</script>

<div
  class="animate-fade-in rounded-lg px-4 py-2 shadow-lg {colors[type]}"
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
