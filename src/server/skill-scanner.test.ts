import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { detectProjectGenerationVersion, extractGeneratedBy } from './skill-scanner.js';

const tempDirs: string[] = [];

async function makeProjectRoot(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'openspec-webui-skill-scan-'));
  tempDirs.push(dir);
  return dir;
}

async function write(dir: string, relPath: string, content = ''): Promise<void> {
  const full = join(dir, relPath);
  await mkdir(join(full, '..'), { recursive: true });
  await writeFile(full, content, 'utf8');
}

function skillMarkdown(generatedBy: string): string {
  return [
    '---',
    'name: openspec-propose',
    'description: Propose a new change.',
    'metadata:',
    '  author: openspec',
    '  version: "1.0"',
    `  generatedBy: "${generatedBy}"`,
    '---',
    '',
    '# openspec-propose',
    '',
  ].join('\n');
}

test('detects the generation version from a skill file in the first root', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));

  assert.equal(await detectProjectGenerationVersion(root), '1.8.0');
});

test('detects the generation version from a later root when earlier roots are absent', async () => {
  const root = await makeProjectRoot();
  await write(root, '.opencode/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  await write(root, '.github/copilot/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));

  assert.equal(await detectProjectGenerationVersion(root), '1.8.0');
});

test('detects the generation version from the standard .github/skills root', async () => {
  const root = await makeProjectRoot();
  await write(root, '.github/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));

  assert.equal(await detectProjectGenerationVersion(root), '1.8.0');
});

test('prefers the standard .github/skills root over the .github/copilot/skills fallback', async () => {
  const root = await makeProjectRoot();
  await write(root, '.github/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  await write(root, '.github/copilot/skills/openspec-propose/SKILL.md', skillMarkdown('9.9.9'));

  assert.equal(await detectProjectGenerationVersion(root), '1.8.0');
});

test('continues to the .github/skills fallback when the standard root has no readable marker', async () => {
  const root = await makeProjectRoot();
  // Standard root holds a SKILL.md without generatedBy; the compatibility
  // fallback root still yields the version.
  await write(root, '.github/skills/openspec-propose/SKILL.md', '# openspec-propose\n\nBody only.');
  await write(root, '.github/copilot/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));

  assert.equal(await detectProjectGenerationVersion(root), '1.8.0');
});

test('adopts the first readable generatedBy in scan order across roots', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  await write(root, '.opencode/skills/openspec-propose/SKILL.md', skillMarkdown('9.9.9'));

  assert.equal(await detectProjectGenerationVersion(root), '1.8.0');
});

test('scans skill directories in a stable sorted order within a root', async () => {
  const root = await makeProjectRoot();
  // z-skill sorts after a-skill, so a-skill is read first.
  await write(root, '.claude/skills/z-skill/SKILL.md', skillMarkdown('2.0.0'));
  await write(root, '.claude/skills/a-skill/SKILL.md', skillMarkdown('1.0.0'));

  assert.equal(await detectProjectGenerationVersion(root), '1.0.0');
});

test('returns null for a project with no skill files', async () => {
  const root = await makeProjectRoot();
  await write(root, 'openspec/config.yaml', 'schema: spec-driven');

  assert.equal(await detectProjectGenerationVersion(root), null);
});

test('returns null when skill directories exist but hold no SKILL.md', async () => {
  const root = await makeProjectRoot();
  await mkdir(join(root, '.claude/skills/openspec-propose'), { recursive: true });
  await mkdir(join(root, '.opencode/skills/openspec-propose'), { recursive: true });

  assert.equal(await detectProjectGenerationVersion(root), null);
});

test('returns null when SKILL.md has no frontmatter', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/skills/openspec-propose/SKILL.md', '# openspec-propose\n\nBody only.');

  assert.equal(await detectProjectGenerationVersion(root), null);
});

test('returns null when SKILL.md frontmatter is malformed YAML', async () => {
  const root = await makeProjectRoot();
  await write(
    root,
    '.claude/skills/openspec-propose/SKILL.md',
    '---\nname: [unclosed\nmetadata:\n  generatedBy: "1.8.0"\n---\n'
  );

  assert.equal(await detectProjectGenerationVersion(root), null);
});

test('returns null when generatedBy is absent from the frontmatter', async () => {
  const root = await makeProjectRoot();
  await write(
    root,
    '.claude/skills/openspec-propose/SKILL.md',
    '---\nname: openspec-propose\nmetadata:\n  author: openspec\n---\n'
  );

  assert.equal(await detectProjectGenerationVersion(root), null);
});

test('returns null when generatedBy is not a string', async () => {
  const root = await makeProjectRoot();
  await write(
    root,
    '.claude/skills/openspec-propose/SKILL.md',
    '---\nname: openspec-propose\nmetadata:\n  generatedBy: 123\n---\n'
  );

  assert.equal(await detectProjectGenerationVersion(root), null);
});

test('continues past unreadable skill files and uses a later candidate', async () => {
  const root = await makeProjectRoot();
  // A directory named SKILL.md cannot be read as a file (EISDIR), so the
  // scanner must move on to the next skill directory.
  await mkdir(join(root, '.claude/skills/openspec-propose/SKILL.md'), { recursive: true });
  await write(root, '.claude/skills/openspec-verify/SKILL.md', skillMarkdown('1.8.0'));

  assert.equal(await detectProjectGenerationVersion(root), '1.8.0');
});

test('returns null when the only skill file is unreadable', async () => {
  const root = await makeProjectRoot();
  await mkdir(join(root, '.claude/skills/openspec-propose/SKILL.md'), { recursive: true });

  assert.equal(await detectProjectGenerationVersion(root), null);
});

test('extractGeneratedBy reads metadata.generatedBy and rejects non-strings', () => {
  assert.equal(extractGeneratedBy({ metadata: { generatedBy: '1.8.0' } }), '1.8.0');
  assert.equal(extractGeneratedBy({ metadata: { generatedBy: ' 1.8.0 ' } }), '1.8.0');
  assert.equal(extractGeneratedBy({ metadata: {} }), null);
  assert.equal(extractGeneratedBy({ metadata: { generatedBy: 123 } }), null);
  assert.equal(extractGeneratedBy({ metadata: { generatedBy: '   ' } }), null);
  assert.equal(extractGeneratedBy({ metadata: null }), null);
  assert.equal(extractGeneratedBy(null), null);
});

test('detection does not modify, create, or delete any project file', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  await write(root, '.opencode/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  await write(root, '.github/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  await write(root, '.github/copilot/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  await write(root, 'openspec/config.yaml', 'schema: spec-driven');
  await write(root, 'README.md', '# Demo project');
  // Empty directories must survive detection too.
  await mkdir(join(root, '.claude/skills/openspec-propose/references'), { recursive: true });

  const before = await snapshotTree(root);
  const version = await detectProjectGenerationVersion(root);
  const after = await snapshotTree(root);

  assert.equal(version, '1.8.0');
  assert.deepEqual(after, before);
});

interface TreeSnapshot {
  files: string[];
  contents: Record<string, string>;
  directories: string[];
}

async function snapshotTree(root: string): Promise<TreeSnapshot> {
  const files: string[] = [];
  const contents: Record<string, string> = {};
  const directories: string[] = [];

  async function walk(relPath: string): Promise<void> {
    const full = relPath ? join(root, relPath) : root;
    const entries = await readdir(full, { withFileTypes: true });

    for (const entry of entries) {
      const childRel = relPath ? join(relPath, entry.name) : entry.name;
      if (entry.isDirectory()) {
        directories.push(childRel);
        await walk(childRel);
      } else if (entry.isFile()) {
        files.push(childRel);
        contents[childRel] = await readFile(join(full, entry.name), 'utf8');
      }
    }
  }

  await walk('');
  return {
    files: [...files].sort(),
    contents,
    directories: [...directories].sort(),
  };
}

// Cleanup temp dirs after all tests.
process.on('exit', () => {
  for (const dir of tempDirs.splice(0)) {
    void rm(dir, { recursive: true, force: true });
  }
});
