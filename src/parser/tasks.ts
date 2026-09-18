import type { Task, TaskProgress } from '../shared/types.js';

/**
 * OpenSpec v1.13.1 task-line pattern with a leading-indent capture for nesting.
 * List markers: `-` `*` `+` or ordered `1.` / `1)` (up to nine digits).
 * Only `x`/`X` is done; empty descriptions are allowed; link bullets are rejected.
 */
const TASK_LINE_PATTERN =
  /^(\s*)(?:[-*+]|\d{1,9}[.)])\s*\[(?:\s*([^\]\s]?)\s*\](?![([])|\s+\])\s*(.*)/;

/**
 * Parse markdown task checkboxes from content
 * Handles nested tasks via indentation
 */
export function parseTasks(content: string): { tasks: Task[]; progress: TaskProgress } {
  const lines = content.split('\n');
  const taskStack: { task: Task; indent: number }[] = [];
  const rootTasks: Task[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(TASK_LINE_PATTERN);

    if (match) {
      const indent = match[1].length;
      const completed = (match[2] ?? '').toLowerCase() === 'x';
      const text = match[3].trim();

      const task: Task = {
        text,
        completed,
        line: i + 1,
        subtasks: [],
      };

      // Find parent based on indentation
      while (taskStack.length > 0 && taskStack[taskStack.length - 1].indent >= indent) {
        taskStack.pop();
      }

      if (taskStack.length === 0) {
        rootTasks.push(task);
      } else {
        taskStack[taskStack.length - 1].task.subtasks.push(task);
      }

      taskStack.push({ task, indent });
    }
  }

  const progress = calculateProgress(rootTasks);

  return { tasks: rootTasks, progress };
}

/**
 * Recursively calculate task completion progress
 */
function calculateProgress(tasks: Task[]): TaskProgress {
  let done = 0;
  let total = 0;

  function countTasks(taskList: Task[]) {
    for (const task of taskList) {
      total++;
      if (task.completed) {
        done++;
      }
      countTasks(task.subtasks);
    }
  }

  countTasks(tasks);

  return {
    done,
    total,
    percentage: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}
