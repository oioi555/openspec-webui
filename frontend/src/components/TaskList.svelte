<script lang="ts">
  import type { Task } from '../lib/api';
  import Icon from './Icon.svelte';
  import TaskList from './TaskList.svelte';

  interface Props {
    tasks: Task[];
    depth?: number;
  }

  let { tasks, depth = 0 }: Props = $props();
</script>

<ul class="space-y-2 {depth > 0 ? 'ml-6 mt-2' : ''}">
  {#each tasks as task}
    <li>
      <div class="flex items-start gap-2">
        <div class="mt-0.5">
          {#if task.completed}
            <Icon name="check-circle" class="h-5 w-5 text-success-solid" />
          {:else}
            <Icon name="circle" class="h-5 w-5 text-on-surface-muted" />
          {/if}
        </div>
        <span class="{task.completed ? 'text-on-surface-muted line-through' : 'text-on-surface'}">
          {task.text}
        </span>
      </div>
      {#if task.subtasks.length > 0}
        <TaskList tasks={task.subtasks} depth={depth + 1} />
      {/if}
    </li>
  {/each}
</ul>
