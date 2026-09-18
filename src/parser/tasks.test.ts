import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseTasks } from './tasks.js';

function flatten(tasks: ReturnType<typeof parseTasks>['tasks']): Array<{
  text: string;
  completed: boolean;
  line: number;
  depth: number;
}> {
  const rows: Array<{ text: string; completed: boolean; line: number; depth: number }> = [];

  function walk(list: typeof tasks, depth: number) {
    for (const task of list) {
      rows.push({ text: task.text, completed: task.completed, line: task.line, depth });
      walk(task.subtasks, depth + 1);
    }
  }

  walk(tasks, 0);
  return rows;
}

test('hyphen nested fixtures keep previous done/total and tree shape', () => {
  const content = [
    '## Tasks',
    '',
    '- [x] completed parent',
    '  - [ ] pending child',
    '    - [x] completed grandchild',
    '- [ ] pending sibling',
    '',
    'Not a task.',
    '* just a bullet',
  ].join('\n');

  const { tasks, progress } = parseTasks(content);

  assert.deepEqual(progress, { done: 2, total: 4, percentage: 50 });
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0]!.text, 'completed parent');
  assert.equal(tasks[0]!.completed, true);
  assert.equal(tasks[0]!.line, 3);
  assert.equal(tasks[0]!.subtasks.length, 1);
  assert.equal(tasks[0]!.subtasks[0]!.text, 'pending child');
  assert.equal(tasks[0]!.subtasks[0]!.completed, false);
  assert.equal(tasks[0]!.subtasks[0]!.subtasks[0]!.text, 'completed grandchild');
  assert.equal(tasks[0]!.subtasks[0]!.subtasks[0]!.completed, true);
  assert.equal(tasks[1]!.text, 'pending sibling');
  assert.equal(tasks[1]!.line, 6);
});

test('counts plus, asterisk, and ordered-list task markers', () => {
  const content = [
    '- [ ] hyphen',
    '* [ ] asterisk',
    '+ [x] plus done',
    '1. [ ] ordered-dot',
    '2) [X] ordered-paren',
    '123456789. [ ] nine-digit',
    '1234567890. [ ] ten-digit ignored',
  ].join('\n');

  const { tasks, progress } = parseTasks(content);
  const rows = flatten(tasks);

  assert.equal(progress.total, 6);
  assert.equal(progress.done, 2);
  assert.deepEqual(
    rows.map((row) => row.text),
    ['hyphen', 'asterisk', 'plus done', 'ordered-dot', 'ordered-paren', 'nine-digit'],
  );
  assert.equal(rows.find((row) => row.text === 'plus done')?.completed, true);
  assert.equal(rows.find((row) => row.text === 'ordered-paren')?.completed, true);
});

test('treats unknown and empty checkbox markers as incomplete', () => {
  const content = [
    '- [~] squiggle',
    '- [] empty-box',
    '- [ ] space-box',
    '- [x] done',
    '- [X] done-upper',
  ].join('\n');

  const { tasks, progress } = parseTasks(content);

  assert.equal(progress.total, 5);
  assert.equal(progress.done, 2);
  assert.equal(tasks[0]!.completed, false);
  assert.equal(tasks[1]!.completed, false);
  assert.equal(tasks[1]!.text, 'empty-box');
  assert.equal(tasks[2]!.completed, false);
});

test('inner padding around x still counts as completed', () => {
  const { tasks, progress } = parseTasks('- [ x] padded\n- [ x ] padded-both\n- [x ] trailing\n');

  assert.equal(progress.total, 3);
  assert.equal(progress.done, 3);
  assert.equal(tasks.every((task) => task.completed === true), true);
});

test('counts empty-description tasks and preserves line numbers', () => {
  const content = '- [x]\n- [ ]\n';
  const { tasks, progress } = parseTasks(content);

  assert.deepEqual(progress, { done: 1, total: 2, percentage: 50 });
  assert.equal(tasks[0]!.text, '');
  assert.equal(tasks[0]!.completed, true);
  assert.equal(tasks[0]!.line, 1);
  assert.equal(tasks[1]!.text, '');
  assert.equal(tasks[1]!.completed, false);
  assert.equal(tasks[1]!.line, 2);
});

test('parses CRLF task lines', () => {
  const { tasks, progress } = parseTasks('- [x] done\r\n- [ ] pending\r\n');

  assert.equal(progress.total, 2);
  assert.equal(progress.done, 1);
  assert.equal(tasks[0]!.text, 'done');
  assert.equal(tasks[1]!.text, 'pending');
});

test('rejects Markdown link bullets but counts whitespace-only checkbox links', () => {
  const content = [
    '- [A](https://example.com) link',
    '- [1](./one) numbered-link',
    '- [x](https://example.com) done-link',
    '- [ ](https://example.com) space-link',
    '- [ ][ref] space-ref',
    '- [x] real task',
  ].join('\n');

  const { tasks, progress } = parseTasks(content);

  assert.equal(progress.total, 3);
  assert.equal(progress.done, 1);
  assert.deepEqual(
    tasks.map((task) => ({ text: task.text, completed: task.completed })),
    [
      { text: '(https://example.com) space-link', completed: false },
      { text: '[ref] space-ref', completed: false },
      { text: 'real task', completed: true },
    ],
  );
});

test('nests mixed list markers by indent', () => {
  const content = [
    '- [ ] parent',
    '  * [x] star-child',
    '    1. [ ] ordered-grandchild',
    '+ [ ] plus-sibling',
  ].join('\n');

  const { tasks, progress } = parseTasks(content);

  assert.deepEqual(progress, { done: 1, total: 4, percentage: 25 });
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0]!.subtasks[0]!.text, 'star-child');
  assert.equal(tasks[0]!.subtasks[0]!.subtasks[0]!.text, 'ordered-grandchild');
  assert.equal(tasks[1]!.text, 'plus-sibling');
});

test('reports zero progress when no checklist tasks exist', () => {
  const { tasks, progress } = parseTasks('# Title\n\nA paragraph.\n- not a checkbox\n');

  assert.deepEqual(tasks, []);
  assert.deepEqual(progress, { done: 0, total: 0, percentage: 0 });
});
