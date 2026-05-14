import { stat } from 'fs/promises';
import type {
  Project,
  Spec,
  Change,
  FileGroup,
  Stats,
  SearchResult,
  SearchMatchSource,
  SearchMatchLocation,
  ParseResult,
} from '../shared/types.js';
import { parseProject } from './project.js';
import { parseSpecs, parseSpec } from './specs.js';
import { parseChanges, parseChangeByName } from './changes.js';

export interface OpenSpecData {
  project: Project;
  specs: Spec[];
  changes: {
    active: Change[];
    archived: Change[];
  };
  stats: Stats;
}

interface SearchableDocument {
  type: SearchResult['type'];
  name: string;
  path: string;
  content: string | null;
  matchLocation?: SearchMatchLocation;
  metadata: Array<{
    source: Exclude<SearchMatchSource, 'content'>;
    searchValue: string;
    previewValue: string;
  }>;
}

const CHANGE_GROUP_ORDER = ['proposal', 'design', 'tasks', 'specs'];

/**
 * Parse an entire OpenSpec directory
 */
export async function parseOpenSpec(openspecPath: string): Promise<ParseResult<OpenSpecData>> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate path exists
  try {
    const stats = await stat(openspecPath);
    if (!stats.isDirectory()) {
      return {
        data: null,
        errors: [`${openspecPath} is not a directory`],
        warnings: [],
      };
    }
  } catch (error) {
    return {
      data: null,
      errors: [`OpenSpec directory not found: ${openspecPath}`],
      warnings: [],
    };
  }

  // Parse all components
  const [projectResult, specsResult, changesResult] = await Promise.all([
    parseProject(openspecPath),
    parseSpecs(openspecPath),
    parseChanges(openspecPath),
  ]);

  errors.push(...projectResult.errors, ...specsResult.errors, ...changesResult.errors);
  warnings.push(...projectResult.warnings, ...specsResult.warnings, ...changesResult.warnings);

  if (!projectResult.data || !specsResult.data || !changesResult.data) {
    return { data: null, errors, warnings };
  }

  // Calculate stats
  const stats = calculateStats(specsResult.data, changesResult.data);

  return {
    data: {
      project: projectResult.data,
      specs: specsResult.data,
      changes: changesResult.data,
      stats,
    },
    errors,
    warnings,
  };
}

/**
 * Calculate overall statistics
 */
function calculateStats(
  specs: Spec[],
  changes: { active: Change[]; archived: Change[] }
): Stats {
  // Calculate overall task progress from active changes
  let totalDone = 0;
  let totalTasks = 0;

  for (const change of changes.active) {
    totalDone += change.taskProgress.done;
    totalTasks += change.taskProgress.total;
  }

  return {
    totalSpecs: specs.length,
    activeChanges: changes.active.length,
    archivedChanges: changes.archived.length,
    overallTaskProgress: {
      done: totalDone,
      total: totalTasks,
      percentage: totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0,
    },
  };
}

/**
 * Search across all OpenSpec content
 */
export function searchOpenSpec(data: OpenSpecData, query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const normalizedQuery = normalizeSearchText(query);

  const projectResult = searchDocument(
    {
      type: 'project',
      name: data.project.name,
      path: data.project.path,
      content: data.project.content,
      metadata: [
        {
          source: 'path',
          searchValue: [data.project.path, 'openspec/config.yaml'].join('\n'),
          previewValue: 'openspec/config.yaml',
        },
      ],
    },
    normalizedQuery
  );

  if (projectResult) {
    results.push(projectResult);
  }

  for (const spec of data.specs) {
    const specResult = searchDocument(
      {
        type: 'spec',
        name: spec.name,
        path: spec.path,
        content: spec.specContent,
        metadata: [
          {
            source: 'path',
            searchValue: [spec.path, `openspec/specs/${spec.name}/spec.md`].join('\n'),
            previewValue: `openspec/specs/${spec.name}/spec.md`,
          },
        ],
      },
      normalizedQuery
    );

    if (specResult) {
      results.push(specResult);
    }
  }

  const allChanges = [...data.changes.active, ...data.changes.archived];
  for (const change of allChanges) {
    const changeResult = searchChange(change, normalizedQuery);

    if (changeResult) {
      results.push(changeResult);
    }
  }

  return results;
}

function searchDocument(document: SearchableDocument, normalizedQuery: string): SearchResult | null {
  const content = document.content ?? '';

  if (content.length > 0 && normalizeSearchText(content).includes(normalizedQuery)) {
    return {
      type: document.type,
      name: document.name,
      path: document.path,
      excerpt: getExcerpt(content, normalizedQuery),
      matchLine: findMatchLine(content, normalizedQuery),
      matchSource: 'content',
      matchLocation: document.matchLocation,
    };
  }

  if (normalizeSearchText(document.name).includes(normalizedQuery)) {
    return {
      type: document.type,
      name: document.name,
      path: document.path,
      excerpt: document.name,
      matchLine: 0,
      matchSource: 'name',
    };
  }

  const metadataMatch = document.metadata.find((candidate) =>
    normalizeSearchText(candidate.searchValue).includes(normalizedQuery)
  );

  if (!metadataMatch) {
    return null;
  }

  return {
    type: document.type,
    name: document.name,
    path: document.path,
    excerpt: metadataMatch.previewValue,
    matchLine: 0,
    matchSource: metadataMatch.source,
  };
}

function searchChange(change: Change, normalizedQuery: string): SearchResult | null {
  const relativeChangePath = change.isArchived
    ? `openspec/changes/archive/${change.name}`
    : `openspec/changes/${change.name}`;

  const sortedFileGroups = [...change.fileGroups].sort((a, b) => compareChangeGroupOrder(a, b));
  const metadataCandidates: SearchableDocument['metadata'] = [
    {
      source: 'path',
      searchValue: [change.path, relativeChangePath].join('\n'),
      previewValue: relativeChangePath,
    },
  ];

  for (const group of sortedFileGroups) {
    for (const file of group.files) {
      const contentResult = searchDocument(
        {
          type: 'change',
          name: change.name,
          path: change.path,
          content: file.content ?? null,
          matchLocation: group.files.length > 1
            ? { fileGroupName: group.name, fileName: file.name }
            : { fileGroupName: group.name },
          metadata: [],
        },
        normalizedQuery,
      );

      if (contentResult) {
        return contentResult;
      }

      metadataCandidates.push(
        {
          source: 'name',
          searchValue: file.name,
          previewValue: file.name,
        },
        {
          source: 'path',
          searchValue: [file.path, `${relativeChangePath}/${file.path}`].join('\n'),
          previewValue: `${relativeChangePath}/${file.path}`,
        },
      );
    }
  }

  for (const otherFile of change.otherFiles) {
    const contentResult = searchDocument(
      {
        type: 'change',
        name: change.name,
        path: change.path,
        content: otherFile.content,
        matchLocation: {
          otherFilePath: otherFile.path,
        },
        metadata: [],
      },
      normalizedQuery,
    );

    if (contentResult) {
      return contentResult;
    }

    metadataCandidates.push(
      {
        source: 'name',
        searchValue: otherFile.name,
        previewValue: otherFile.name,
      },
      {
        source: 'path',
        searchValue: [otherFile.path, `${relativeChangePath}/${otherFile.path}`].join('\n'),
        previewValue: `${relativeChangePath}/${otherFile.path}`,
      },
    );
  }

  for (const delta of change.specDeltas) {
    const relativeSpecDeltaPath = `${relativeChangePath}/specs/${delta.capability}/spec.md`;
    const contentResult = searchDocument(
      {
        type: 'change',
        name: change.name,
        path: change.path,
        content: delta.content,
        matchLocation: {
          specDeltaCapability: delta.capability,
        },
        metadata: [],
      },
      normalizedQuery,
    );

    if (contentResult) {
      return contentResult;
    }

    metadataCandidates.push(
      {
        source: 'name',
        searchValue: delta.capability,
        previewValue: delta.capability,
      },
      {
        source: 'path',
        searchValue: relativeSpecDeltaPath,
        previewValue: relativeSpecDeltaPath,
      },
    );
  }

  if (normalizeSearchText(change.name).includes(normalizedQuery)) {
    return {
      type: 'change',
      name: change.name,
      path: change.path,
      excerpt: change.name,
      matchLine: 0,
      matchSource: 'name',
    };
  }

  const metadataMatch = metadataCandidates.find((candidate) =>
    normalizeSearchText(candidate.searchValue).includes(normalizedQuery),
  );

  if (!metadataMatch) {
    return null;
  }

  return {
    type: 'change',
    name: change.name,
    path: change.path,
    excerpt: metadataMatch.previewValue,
    matchLine: 0,
    matchSource: metadataMatch.source,
  };
}

function compareChangeGroupOrder(a: FileGroup, b: FileGroup): number {
  const orderDiff = changeGroupSortIndex(a.name) - changeGroupSortIndex(b.name);
  if (orderDiff !== 0) {
    return orderDiff;
  }

  return a.name.localeCompare(b.name);
}

function changeGroupSortIndex(name: string): number {
  const lower = name.toLowerCase();

  for (let index = 0; index < CHANGE_GROUP_ORDER.length; index += 1) {
    if (lower.includes(CHANGE_GROUP_ORDER[index])) {
      return index;
    }
  }

  return CHANGE_GROUP_ORDER.length;
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replaceAll('\\', '/');
}

/**
 * Find the line number of first match
 */
function findMatchLine(content: string, query: string): number {
  const lowerContent = content.toLowerCase();
  const index = lowerContent.indexOf(query);
  if (index === -1) return 0;

  const beforeMatch = content.substring(0, index);
  return beforeMatch.split('\n').length;
}

/**
 * Get an excerpt around the match
 */
function getExcerpt(content: string, query: string): string {
  const lowerContent = content.toLowerCase();
  const index = lowerContent.indexOf(query);
  if (index === -1) return content.substring(0, 100) + '...';

  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + query.length + 50);

  let excerpt = content.substring(start, end);
  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt = excerpt + '...';

  return excerpt.replace(/\n/g, ' ');
}

// Re-export individual parsers for targeted updates
export { parseProject } from './project.js';
export { parseSpecs, parseSpec } from './specs.js';
export { parseChanges, parseChangeByName } from './changes.js';
export { parseTasks } from './tasks.js';
