<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { setTabsContext } from './context';

  interface Props {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    value = undefined,
    defaultValue: initialValue = '',
    onValueChange = () => {},
    class: className = '',
    children,
    ...restProps
  }: Props = $props();

  let internalValue = $state('');

  $effect(() => {
    if (value === undefined) {
      internalValue = initialValue;
    }
  });

  function getValue() {
    return value ?? internalValue;
  }

  function setValue(nextValue: string) {
    if (value === undefined) {
      internalValue = nextValue;
    }

    onValueChange(nextValue);
  }

  setTabsContext({ getValue, setValue });
</script>

<div {...restProps} class={cn('w-full', className)}>
  {@render children?.()}
</div>
