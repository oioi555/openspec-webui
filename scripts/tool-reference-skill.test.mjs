import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const skillUrl = new URL('../.agents/skills/update-tool-reference/SKILL.md', import.meta.url);
const evalsUrl = new URL('../.agents/skills/update-tool-reference/evals/evals.json', import.meta.url);

test('update skill requires caller-owned release scope and official-first classification', async () => {
  const source = await readFile(skillUrl, 'utf8');
  assert.match(source, /^---\nname: update-tool-reference\n/m);
  assert.match(source, /Require the caller to provide the target OpenSpec release\/tag/);
  assert.match(source, /Do not poll GitHub, detect releases, schedule a future run, or start automation/);
  const sourceOrder = source.slice(source.indexOf('## Source order'));
  assert.ok(sourceOrder.indexOf('Fetch `docs/supported-tools.md`') < sourceOrder.indexOf('vercel-labs/skills'));
  assert.ok(sourceOrder.indexOf('official GitHub release notes') < sourceOrder.indexOf('vercel-labs/skills'));
  assert.match(source, /Release notes are formal OpenSpec release data/);
  assert.match(source, /If either official source is unavailable, stop without writing/);
  assert.match(source, /an unresolved conflict is never writable/);
  assert.match(source, /vercel-labs\/skills/);
});

test('update skill is analyze-first and guards explicit writes with the review hash', async () => {
  const source = await readFile(skillUrl, 'utf8');
  const analyzeIndex = source.indexOf('## Analyze');
  const writeIndex = source.indexOf('## Write only after approval');
  assert.ok(analyzeIndex >= 0 && writeIndex > analyzeIndex);
  assert.match(source, /--review-hash <displayed-sha256>/);
  assert.match(source, /A no-change run stops here without rewriting files/);
});

test('skill evaluations cover the required release and refresh cases', async () => {
  const evaluations = JSON.parse(await readFile(evalsUrl, 'utf8'));
  assert.equal(evaluations.skill_name, 'update-tool-reference');
  assert.ok(evaluations.evals.length >= 3);
  const prompts = evaluations.evals.map((entry) => entry.prompt).join('\n');
  for (const phrase of [
    'v1.11.0 was released',
    'automatically when it arrives',
    'same release and unchanged',
    'release notes move Antigravity',
    'release page for the selected OpenSpec tag is unavailable',
  ]) assert.match(prompts, new RegExp(phrase));
});
