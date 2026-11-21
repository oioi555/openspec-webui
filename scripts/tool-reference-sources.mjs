// Upstream source readers for the tool-reference maintenance workflow.
// Pure readers (page selection, table readers, skills agent table, OpenSpec
// installer aliases, scope builder) are exported for tests; the fetch helper
// assembles a reviewable analysis input from GitHub and fails closed per source.

import { posix } from 'node:path';

const OPENSPEC_REPO = 'Fission-AI/OpenSpec';
const SKILLS_REPO = 'vercel-labs/skills';

export function parseReleaseTag(tag) {
  const match = /^v(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(String(tag ?? '').trim());
  if (!match) throw new Error(`Release tag must look like vMAJOR.MINOR.PATCH: ${tag}`);
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

/** The official supported-tools page for a release line, chosen by semver major. */
export function supportedToolsPage(tag) {
  const { major } = parseReleaseTag(tag);
  const path = major >= 2 ? 'docs-lab/reference/supported-tools.md' : 'docs/supported-tools.md';
  return {
    path,
    layout: major >= 2 ? 'skills-matrix' : 'tool-directory',
    url: `https://github.com/${OPENSPEC_REPO}/blob/${tag}/${path}`,
    rawUrl: `https://raw.githubusercontent.com/${OPENSPEC_REPO}/${tag}/${path}`,
  };
}

/** Whether a release bundles the Vercel `skills` package (2.x and later). */
export function releaseBundlesSkills(tag) {
  return parseReleaseTag(tag).major >= 2;
}

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function unwrapCode(cell) {
  const match = /^`([^`]+)`$/.exec(cell.trim());
  return match ? match[1] : null;
}

function stripLink(cell) {
  return cell.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();
}

const TABLE_LAYOUTS = {
  'tool-directory': ['Tool (ID)', 'Skills path pattern', 'Command path pattern'],
  'skills-matrix': ['Tool', '`--tools` id', 'Skills', 'Skill invocation'],
};

function findTable(markdown, header) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim().startsWith('|')
    && JSON.stringify(splitRow(line)) === JSON.stringify(header));
  if (start < 0) return null;
  if (!/^\|[\s|:-]+\|$/.test(lines[start + 1]?.trim() ?? '')) return null;
  const rows = [];
  for (const line of lines.slice(start + 2)) {
    if (!line.trim().startsWith('|')) break;
    const cells = splitRow(line);
    if (cells.length !== header.length) throw new Error(`Unexpected cell count in supported-tools row: ${line}`);
    rows.push(cells);
  }
  if (rows.length === 0) throw new Error('Supported-tools table has no rows');
  return rows;
}

function readToolDirectoryRows(rows) {
  return rows.map(([tool, skills, commands]) => {
    const match = /^(.*)\(`([a-z0-9-]+)`\)$/.exec(stripLink(tool));
    if (!match) throw new Error(`Unrecognized tool cell: ${tool}`);
    const skillsPath = /^`([^`]+)`/.exec(skills)?.[1] ?? null;
    const commandsPath = /^`([^`]+)`/.exec(commands)?.[1] ?? null;
    return { id: match[2], name: match[1].trim(), skillsPath, commandsPath };
  });
}

const SKILL_INVOCATIONS = [
  [/^`\/openspec-apply-change`$/, '/openspec-<skill>'],
  [/^`\$openspec-apply-change`$/, '$openspec-<skill>'],
  [/^`\/skill:openspec-apply-change`$/, '/skill:openspec-<skill>'],
  [/^ask for `openspec-apply-change`$/, 'use the openspec-<skill> skill'],
];

function readSkillsMatrixRows(rows) {
  return rows.map(([tool, idCell, skills, invocationCell]) => {
    const id = unwrapCode(idCell);
    if (!id || !/^[a-z0-9-]+$/.test(id)) throw new Error(`Unrecognized --tools id cell: ${idCell}`);
    const skillsMatch = /^`\.agents\/skills\/`(?: \(also in `([^`]+)`\))?$/.exec(skills);
    if (!skillsMatch) throw new Error(`Unrecognized skills cell for ${id}: ${skills}`);
    const invocation = SKILL_INVOCATIONS.find(([pattern]) => pattern.test(invocationCell))?.[1];
    if (!invocation) throw new Error(`Unrecognized skill invocation for ${id}: ${invocationCell}`);
    const ownDir = skillsMatch[1]?.replace(/\/$/, '') ?? null;
    return { id, name: stripLink(tool), sharedSkillsDir: '.agents/skills', ownSkillsDir: ownDir, invocation };
  });
}

/**
 * Read the supported-tools table for a release. The table layout must match
 * the release line's known layout; any other layout fails closed.
 */
export function readSupportedToolsTable(markdown, tag) {
  const { layout } = supportedToolsPage(tag);
  const rows = findTable(markdown, TABLE_LAYOUTS[layout]);
  if (!rows) throw new Error(`Supported-tools page for ${tag} does not contain the known ${layout} table layout`);
  return layout === 'skills-matrix' ? readSkillsMatrixRows(rows) : readToolDirectoryRows(rows);
}

// ---------------------------------------------------------------------------
// vercel-labs/skills agent table (src/agents.ts at the bundled tag)

/** Reviewed expressions the generic reader cannot evaluate. Anything else fails closed. */
export const REVIEWED_GLOBAL_DIR_EXPRESSIONS = Object.freeze({
  // Falls back to ~/.clawdbot or ~/.moltbot only when those exist and ~/.openclaw does not.
  'getOpenClawGlobalSkillsDir()': { path: '.openclaw/skills' },
});

/** Reviewed base directories declared with platform branches. */
export const REVIEWED_BASE_DIRS = Object.freeze({
  // Non-Windows default; Windows uses %APPDATA%/reasonix.
  reasonixHome: { path: '.reasonix', env: 'REASONIX_HOME' },
});

function readBaseDirs(source) {
  const bases = { home: { path: '' } };
  const configHome = /const configHome = xdgConfig \?\? join\(home, '([^']+)'\);/.exec(source);
  if (configHome) bases.configHome = { path: configHome[1], env: 'XDG_CONFIG_HOME' };
  const envPattern = /const (\w+) = process\.env\.(\w+)\?\.trim\(\) \|\| join\(home, '([^']+)'\);/g;
  for (const match of source.matchAll(envPattern)) bases[match[1]] = { path: match[3], env: match[2] };
  for (const [name, base] of Object.entries(REVIEWED_BASE_DIRS)) {
    if (!bases[name] && new RegExp(`const ${name} =`).test(source)) bases[name] = base;
  }
  return bases;
}

function evaluateGlobalDir(expression, bases, agentId) {
  if (expression === 'undefined') return null;
  if (REVIEWED_GLOBAL_DIR_EXPRESSIONS[expression]) return { ...REVIEWED_GLOBAL_DIR_EXPRESSIONS[expression] };
  const match = /^join\((\w+)((?:, '[^']+')+)\)$/.exec(expression);
  const base = match ? bases[match[1]] : undefined;
  if (!match || !base) throw new Error(`Unsupported globalSkillsDir expression for ${agentId}: ${expression}`);
  const parts = [...match[2].matchAll(/'([^']+)'/g)].map((part) => part[1]);
  const path = posix.join(base.path, ...parts);
  return base.env ? { path, env: { name: base.env, path: posix.join(...parts) } } : { path };
}

function readStringField(block, field) {
  return new RegExp(`^    ${field}: '([^']*)',$`, 'm').exec(block)?.[1];
}

/**
 * Read `export const agents` from vercel-labs/skills `src/agents.ts` into the
 * shape `getSupportedAgents()` returns, plus `globalReadsCanonical`.
 */
export function readSkillsAgentTable(source) {
  const start = source.indexOf('export const agents: Record<AgentType, AgentConfig> = {');
  if (start < 0) throw new Error('skills agents.ts: agent table not found');
  const end = source.indexOf('\n};\n', start);
  if (end < 0) throw new Error('skills agents.ts: agent table end not found');
  if (!/export function isUniversalAgent\(type: AgentType\): boolean \{\s*return agents\[type\]\.skillsDir === '\.agents\/skills';/.test(source)) {
    throw new Error('skills agents.ts: isUniversalAgent semantics changed');
  }
  const bases = readBaseDirs(source.slice(0, start));
  const body = source.slice(start, end);
  const headers = [...body.matchAll(/^  '?([a-z0-9-]+)'?: \{$/gm)];
  if (headers.length === 0) throw new Error('skills agents.ts: no agents found');
  return headers.map((header, index) => {
    const id = header[1];
    const block = body.slice(header.index, headers[index + 1]?.index ?? body.length);
    const name = readStringField(block, 'displayName');
    const projectSkillsDir = readStringField(block, 'skillsDir');
    const expression = /^    globalSkillsDir: (.+),$/m.exec(block)?.[1];
    if (!name || !projectSkillsDir || expression === undefined) {
      throw new Error(`skills agents.ts: agent ${id} lacks displayName, skillsDir or globalSkillsDir`);
    }
    return {
      id,
      name,
      projectSkillsDir,
      globalSkillsDir: evaluateGlobalDir(expression.trim(), bases, id),
      universal: projectSkillsDir === '.agents/skills',
      globalReadsCanonical: !/^    globalReadsCanonical: false,$/m.test(block),
    };
  });
}

// ---------------------------------------------------------------------------
// OpenSpec src/core/config.ts at the selected tag

/** Read `installerAliases`, `existingTools` and the AI_TOOLS extra-agent exclusions. */
export function readOpenSpecInstallerConfig(source) {
  const aliasBlock = /const installerAliases: Record<string, string> = \{([\s\S]*?)\};/.exec(source)?.[1];
  if (aliasBlock === undefined) throw new Error('OpenSpec config.ts: installerAliases not found');
  const installerAliases = Object.fromEntries(
    [...aliasBlock.matchAll(/([a-z0-9-]+|'[a-z0-9-]+'): '([a-z0-9-]+)'/g)]
      .map((match) => [match[1].replace(/'/g, ''), match[2]])
  );
  if (!/agentsById\.get\(installerAliases\[toolId\] \?\? toolId\) \?\? agentsById\.get\('universal'\)!/.test(source)) {
    throw new Error('OpenSpec config.ts: installerAgent semantics changed');
  }
  const toolsBlock = /const existingTools: AIToolOption\[\] = \[([\s\S]*?)\n\];/.exec(source)?.[1];
  if (toolsBlock === undefined) throw new Error('OpenSpec config.ts: existingTools not found');
  const existingTools = [...toolsBlock.matchAll(/\{ name: '((?:[^'\\]|\\.)*)', value: '([a-z0-9-]+)'/g)]
    .map((match) => ({ id: match[2], name: match[1].replace(/\\'/g, "'") }));
  if (existingTools.length === 0) throw new Error('OpenSpec config.ts: no existing tools found');
  const extras = /\.\.\.agents\.filter\(agent => !existingIds\.has\(agent\.id\)((?: && agent\.id !== '[a-z0-9-]+')*)\)/.exec(source);
  if (!extras) throw new Error('OpenSpec config.ts: AI_TOOLS extra-agent rule not found');
  const excludedAgentIds = [...extras[1].matchAll(/'([a-z0-9-]+)'/g)].map((match) => match[1]);
  return { installerAliases, existingTools, excludedAgentIds };
}

/** OpenSpec `installerAgent(toolId)`: alias, then same id, then `universal`. */
export function installerAgent(toolId, agents, installerAliases) {
  const byId = new Map(agents.map((agent) => [agent.id, agent]));
  const agent = byId.get(installerAliases[toolId] ?? toolId) ?? byId.get('universal');
  if (!agent) throw new Error('skills agent table has no universal agent');
  return agent;
}

/** OpenSpec `AI_TOOLS` ids: existing tools plus every bundled agent not already covered. */
export function openSpecToolIds({ existingTools, excludedAgentIds, installerAliases }, agents) {
  const existingAgentIds = new Set(existingTools.map((tool) => installerAgent(tool.id, agents, installerAliases).id));
  const extras = agents.filter((agent) => !existingAgentIds.has(agent.id) && !excludedAgentIds.includes(agent.id));
  return [
    ...existingTools.map((tool) => ({ id: tool.id, name: tool.name, origin: 'existing' })),
    ...extras.map((agent) => ({ id: agent.id, name: agent.name, origin: 'skills-agent', projectSkillsDir: agent.projectSkillsDir })),
  ];
}

/** Mirror the bundled installer: no global dir → project-only; canonical reader → universal; else linked. */
export function scopeForAgent(agent) {
  if (agent.globalSkillsDir === null) return { kind: 'project-only' };
  if (agent.universal && agent.globalReadsCanonical) return { kind: 'universal' };
  return {
    kind: 'linked',
    globalDir: agent.globalSkillsDir.path,
    ...(agent.globalSkillsDir.env ? { env: agent.globalSkillsDir.env } : {}),
  };
}

export function buildToolScopeSupport({ openspecTag, skillsVersion, toolIds, agents, installerAliases }) {
  const tools = {};
  for (const id of [...toolIds].sort()) tools[id] = scopeForAgent(installerAgent(id, agents, installerAliases));
  return { source: { openspecTag, skillsVersion }, tools };
}

export function diffToolScopeSupport(previous, next) {
  const before = previous?.tools ?? {};
  const after = next?.tools ?? {};
  const json = (value) => JSON.stringify(value);
  return {
    sourceChanged: json(previous?.source ?? null) !== json(next?.source ?? null),
    from: previous?.source ?? null,
    to: next?.source ?? null,
    added: Object.keys(after).filter((id) => !(id in before)).sort(),
    removed: Object.keys(before).filter((id) => !(id in after)).sort(),
    changed: Object.keys(after)
      .filter((id) => id in before && json(before[id]) !== json(after[id]))
      .sort()
      .map((id) => ({ id, from: before[id], to: after[id] })),
  };
}

/** The exact `skills` version a release declares (no ranges: the bundled version must be pinned). */
export function readBundledSkillsVersion(packageJson) {
  const version = packageJson?.dependencies?.skills;
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`OpenSpec package.json must pin an exact skills version, got ${JSON.stringify(version)}`);
  }
  return version;
}

// ---------------------------------------------------------------------------
// 2.x official dataset

/** v1.14.0 skill invocations from the frozen legacy table, for tools the 2.x page omits. */
export function legacySkillInvocations(legacyTable) {
  return Object.fromEntries((legacyTable?.skills ?? []).map((entry) => [entry.id, entry.skills.invocation]));
}

/**
 * Build the 2.x official dataset from the skills-matrix rows plus the tag's
 * `AI_TOOLS` entries that the page does not list (it defers to `init --help`).
 */
export function buildOfficialDatasetV2({ tag, revision, checkedAt, rows, toolIds, legacyInvocations = {} }) {
  const page = supportedToolsPage(tag);
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const knownIds = new Set(toolIds.map((tool) => tool.id));
  const undocumented = rows.filter((row) => !knownIds.has(row.id)).map((row) => row.id);
  if (undocumented.length > 0) throw new Error(`Supported-tools rows missing from AI_TOOLS: ${undocumented.join(', ')}`);
  const tools = toolIds.map((tool) => {
    const row = rowById.get(tool.id);
    const dir = row ? (row.ownSkillsDir ?? row.sharedSkillsDir) : tool.projectSkillsDir ?? '.agents/skills';
    return {
      id: tool.id,
      name: row?.name ?? tool.name,
      commands: null,
      skills: { path: `${dir}/openspec-*/SKILL.md`, invocation: row?.invocation ?? legacyInvocations[tool.id] ?? '/openspec-<skill>' },
    };
  });
  return {
    dataset: {
      schemaVersion: 1,
      source: { version: tag, revision, url: page.url, checkedAt },
      tools,
    },
    notListedOnPage: toolIds.filter((tool) => !rowById.has(tool.id)).map((tool) => tool.id),
  };
}

// ---------------------------------------------------------------------------
// Network assembly (fails closed per source)

async function fetchText(url, fetchImpl) {
  const response = await fetchImpl(url, { headers: { 'user-agent': 'openspec-webui-tool-reference' } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

async function fetchJson(url, fetchImpl) {
  return JSON.parse(await fetchText(url, fetchImpl));
}

async function tagCommit(repo, tag, fetchImpl) {
  const commit = await fetchJson(`https://api.github.com/repos/${repo}/commits/${tag}`, fetchImpl);
  if (typeof commit?.sha !== 'string') throw new Error(`${repo}@${tag}: commit not found`);
  return commit.sha;
}

/**
 * Fetch every upstream source for a 2.x release and assemble an analysis
 * input. Release-note conflicts stay empty for the reviewer to fill in.
 */
export async function prepareAnalysisInput({ tag, checkedAt, previousResearch = null, legacyTable = null, fetchImpl = globalThis.fetch }) {
  if (!releaseBundlesSkills(tag)) throw new Error('Automatic source assembly supports v2.0.0 and later only');
  const raw = (repo, ref, path) => `https://raw.githubusercontent.com/${repo}/${ref}/${path}`;
  const notes = [];
  const input = { targetRelease: tag, checkedAt };

  let revision = null;
  let config = null;
  let agents = null;
  let skillsVersion = null;
  let skillsRevision = null;
  try {
    revision = await tagCommit(OPENSPEC_REPO, tag, fetchImpl);
    config = readOpenSpecInstallerConfig(await fetchText(raw(OPENSPEC_REPO, tag, 'src/core/config.ts'), fetchImpl));
    skillsVersion = readBundledSkillsVersion(await fetchJson(raw(OPENSPEC_REPO, tag, 'package.json'), fetchImpl));
    skillsRevision = await tagCommit(SKILLS_REPO, `v${skillsVersion}`, fetchImpl);
    agents = readSkillsAgentTable(await fetchText(raw(SKILLS_REPO, `v${skillsVersion}`, 'src/agents.ts'), fetchImpl));
  } catch (error) {
    notes.push(`release sources unavailable: ${error.message}`);
  }

  const page = supportedToolsPage(tag);
  if (config && agents) {
    try {
      const rows = readSupportedToolsTable(await fetchText(page.rawUrl, fetchImpl), tag);
      const toolIds = openSpecToolIds(config, agents);
      const { dataset, notListedOnPage } = buildOfficialDatasetV2({
        tag, revision, checkedAt, rows, toolIds, legacyInvocations: legacySkillInvocations(legacyTable),
      });
      input.openspec = { available: true, url: page.url, revision, dataset, notListedOnPage };
      input.skillScope = {
        available: true,
        openspecTag: tag,
        skillsVersion,
        skillsRevision,
        agents,
        installerAliases: config.installerAliases,
      };
    } catch (error) {
      notes.push(`supported-tools page unavailable: ${error.message}`);
    }
  }
  input.openspec ??= { available: false, url: page.url };
  input.skillScope ??= { available: false, openspecTag: tag };

  try {
    const release = await fetchJson(`https://api.github.com/repos/${OPENSPEC_REPO}/releases/tags/${tag}`, fetchImpl);
    if (release?.tag_name !== tag) throw new Error('release tag mismatch');
    input.releaseNotes = {
      available: true,
      url: `https://github.com/${OPENSPEC_REPO}/releases/tag/${tag}`,
      revision: revision ?? release.target_commitish,
      body: release.body ?? '',
      conflicts: [],
    };
  } catch (error) {
    notes.push(`release notes unavailable: ${error.message}`);
    input.releaseNotes = { available: false };
  }

  // The shared-client research list keeps its own provenance; carry it over
  // unchanged unless the caller deliberately refreshes it.
  input.vercelSkills = previousResearch
    ? {
      available: true,
      url: previousResearch.source.url,
      revision: previousResearch.source.revision,
      candidates: previousResearch.clients.map((client) => ({ id: client.id, name: client.name })),
    }
    : { available: false };
  input.notes = notes;
  return input;
}
