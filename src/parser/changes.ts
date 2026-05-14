import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import type { Change, ChangeFile, FileGroup, OtherFile, SpecDelta, DeltaOperation, ParseResult } from '../shared/types.js';
import { parseTasks } from './tasks.js';

const STANDARD_CHANGE_FILES = new Set(['proposal.md', 'design.md', 'tasks.md']);
const OTHER_FILE_NOISE_NAMES = new Set(['.openspec.yaml']);

function detectOtherFileType(fileName: string): OtherFile['type'] {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.md')) {
    return 'markdown';
  }
  if (lowerName.endsWith('.json')) {
    return 'json';
  }
  if (lowerName.endsWith('.yaml') || lowerName.endsWith('.yml')) {
    return 'yaml';
  }
  return 'text';
}

async function discoverOtherFiles(changePath: string): Promise<OtherFile[]> {
  const otherFiles: OtherFile[] = [];

  try {
    const entries = await readdir(changePath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      if (STANDARD_CHANGE_FILES.has(entry.name.toLowerCase())) {
        continue;
      }

      const absolutePath = join(changePath, entry.name);

      try {
        const content = await readFile(absolutePath, 'utf-8');
        otherFiles.push({
          name: entry.name,
          path: entry.name,
          absolutePath,
          type: detectOtherFileType(entry.name),
          content,
        });
      } catch {
        // Ignore unreadable or binary files.
      }
    }
  } catch {
    // Change directory unavailable.
  }

  otherFiles.sort((a, b) => a.path.localeCompare(b.path));
  return otherFiles;
}

function computeMeaningfulOtherFileCount(otherFiles: OtherFile[]): number {
  return otherFiles.filter((file) => !OTHER_FILE_NOISE_NAMES.has(file.name.toLowerCase())).length;
}

/**
 * Recursively discover markdown change artifacts that participate in the main
 * tabbed viewer. Direct root-level non-standard files are handled separately as
 * Other Files.
 */
async function discoverChangeFiles(
  changePath: string,
  relativePath: string = ''
): Promise<ChangeFile[]> {
  const files: ChangeFile[] = [];
  const currentPath = join(changePath, relativePath);

  try {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryRelPath = relativePath ? join(relativePath, entry.name) : entry.name;

      if (entry.isDirectory()) {
        // Skip specs/ directory (handled separately as spec deltas)
        if (entry.name === 'specs') continue;

        // Recurse into subdirectories
        const subFiles = await discoverChangeFiles(changePath, entryRelPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = entry.name.toLowerCase();
        if (ext.endsWith('.md')) {
          if (relativePath === '' && !STANDARD_CHANGE_FILES.has(entry.name.toLowerCase())) {
            continue;
          }

          const folder = relativePath || 'root';
          const nameWithoutExt = entry.name.replace(/\.md$/i, '');

          files.push({
            name: nameWithoutExt,
            path: entryRelPath,
            absolutePath: join(currentPath, entry.name),
            type: 'markdown',
            folder,
          });
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }

  return files;
}

/**
 * Recursively collect markdown file paths under a directory.
 */
async function discoverContentFilePaths(
  basePath: string,
  relativePath: string = ''
): Promise<string[]> {
  const paths: string[] = [];
  const currentPath = join(basePath, relativePath);

  try {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryRelPath = relativePath ? join(relativePath, entry.name) : entry.name;

      if (entry.isDirectory()) {
        const subPaths = await discoverContentFilePaths(basePath, entryRelPath);
        paths.push(...subPaths);
      } else if (entry.isFile()) {
        const lowerName = entry.name.toLowerCase();
        if (lowerName.endsWith('.md')) {
          paths.push(join(currentPath, entry.name));
        }
      }
    }
  } catch {
    // Directory is optional or unreadable
  }

  return paths;
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Group files by folder for tab navigation
 * Core files (proposal, tasks, design) each get their own tab
 * Other files are grouped by folder
 */
function groupChangeFiles(files: ChangeFile[]): FileGroup[] {
  const coreFileNames = ['proposal', 'tasks', 'design'];
  const coreOrder: Record<string, number> = { proposal: 0, tasks: 1, design: 2 };
  const groups: FileGroup[] = [];

  // Separate core files from others
  const coreFiles: ChangeFile[] = [];
  const otherFiles: ChangeFile[] = [];

  for (const file of files) {
    if (file.folder === 'root' && coreFileNames.includes(file.name.toLowerCase())) {
      coreFiles.push(file);
    } else {
      otherFiles.push(file);
    }
  }

  // Sort core files in specific order and create individual tabs for each
  coreFiles.sort((a, b) =>
    (coreOrder[a.name.toLowerCase()] ?? 99) - (coreOrder[b.name.toLowerCase()] ?? 99)
  );

  for (const file of coreFiles) {
    groups.push({
      name: capitalizeFirst(file.name),
      folder: '',
      files: [file],
      isCore: true,
    });
  }

  // Group remaining files by folder
  const folderGroups: Map<string, FileGroup> = new Map();

  for (const file of otherFiles) {
    const folderKey = file.folder === 'root' ? 'Other' : file.folder;
    const displayName = file.folder === 'root' ? 'Other' : capitalizeFirst(file.folder);

    if (!folderGroups.has(folderKey)) {
      folderGroups.set(folderKey, {
        name: displayName,
        folder: file.folder,
        files: [],
        isCore: false,
      });
    }
    folderGroups.get(folderKey)!.files.push(file);
  }

  // Sort files within each folder group alphabetically
  for (const group of folderGroups.values()) {
    group.files.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Add folder groups sorted alphabetically after core tabs
  const sortedFolderGroups = Array.from(folderGroups.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  groups.push(...sortedFolderGroups);

  return groups;
}

/**
 * Parse all changes from the changes/ directory
 */
export async function parseChanges(openspecPath: string): Promise<ParseResult<{ active: Change[]; archived: Change[] }>> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const active: Change[] = [];
  const archived: Change[] = [];

  const changesPath = join(openspecPath, 'changes');

  try {
    const entries = await readdir(changesPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name === 'archive') {
          // Parse archived changes
          const archiveResult = await parseArchivedChanges(join(changesPath, 'archive'));
          archived.push(...archiveResult.data);
          errors.push(...archiveResult.errors);
          warnings.push(...archiveResult.warnings);
        } else {
          // Parse active change
          const changePath = join(changesPath, entry.name);
          const changeResult = await parseChange(entry.name, changePath, false);

          if (changeResult.data) {
            active.push(changeResult.data);
          }
          errors.push(...changeResult.errors);
          warnings.push(...changeResult.warnings);
        }
      }
    }

    // Sort active changes alphabetically
    active.sort((a, b) => a.name.localeCompare(b.name));

    // Sort archived by lastModified (newest first)
    archived.sort((a, b) => {
      if (a.lastModified && b.lastModified) {
        const timestampDiff = new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        if (!Number.isNaN(timestampDiff) && timestampDiff !== 0) {
          return timestampDiff;
        }
      }
      return a.name.localeCompare(b.name);
    });

    return { data: { active, archived }, errors, warnings };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      warnings.push('changes/ directory not found');
      return { data: { active: [], archived: [] }, errors, warnings };
    }
    errors.push(`Failed to read changes directory: ${error}`);
    return { data: null, errors, warnings };
  }
}

/**
 * Parse archived changes from archive/ directory
 */
async function parseArchivedChanges(archivePath: string): Promise<{ data: Change[]; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const archived: Change[] = [];

  try {
    const entries = await readdir(archivePath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const changePath = join(archivePath, entry.name);
        const changeResult = await parseChange(entry.name, changePath, true);

        if (changeResult.data) {
          archived.push(changeResult.data);
        }
        errors.push(...changeResult.errors);
        warnings.push(...changeResult.warnings);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      errors.push(`Failed to read archive directory: ${error}`);
    }
  }

  return { data: archived, errors, warnings };
}

/**
 * Parse a single change directory
 */
async function parseChange(
  name: string,
  changePath: string,
  isArchived: boolean
): Promise<ParseResult<Change>> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Extract date from archived change name (YYYY-MM-DD-name format)
  let archivedDate: string | null = null;
  if (isArchived) {
    const dateMatch = name.match(/^(\d{4}-\d{2}-\d{2})-/);
    if (dateMatch) {
      archivedDate = dateMatch[1];
    }
  }

  // Discover all .md files recursively
  const files = await discoverChangeFiles(changePath);
  const otherFiles = await discoverOtherFiles(changePath);

  // Load content for markdown files
  for (const file of files) {
    try {
      file.content = await readFile(file.absolutePath, 'utf-8');
    } catch (error) {
      warnings.push(`${name}: Failed to read ${file.path}`);
    }
  }

  // Group files for UI
  const fileGroups = groupChangeFiles(files);

  // Extract legacy fields for backward compatibility
  const proposalFile = files.find(f => f.folder === 'root' && f.name.toLowerCase() === 'proposal');
  const tasksFile = files.find(f => f.folder === 'root' && f.name.toLowerCase() === 'tasks');
  const designFile = files.find(f => f.folder === 'root' && f.name.toLowerCase() === 'design');

  const proposal = proposalFile?.content ?? null;
  const tasksContent = tasksFile?.content ?? null;
  const design = designFile?.content ?? null;

  const { tasks, progress: taskProgress } = parseTasks(tasksContent || '');

  // Parse spec deltas
  const specDeltas = await parseSpecDeltas(join(changePath, 'specs'));
  const specDeltaPaths = await discoverContentFilePaths(join(changePath, 'specs'));

  return {
    data: {
      name,
      path: changePath,
      isArchived,
      archivedDate,
      proposal,
      tasks,
      tasksRaw: tasksContent,
      taskProgress,
      design,
      specDeltas: specDeltas.data,
      lastModified: await computeLastModifiedAsync(files, [
        ...specDeltaPaths,
        ...otherFiles.map((file) => file.absolutePath),
      ]),
      files,
      fileGroups,
      otherFiles,
      otherFileCount: computeMeaningfulOtherFileCount(otherFiles),
    },
    errors,
    warnings,
  };
}

/**
 * Compute lastModified by stat-ing change files and spec delta files for their mtime
 */
async function computeLastModifiedAsync(
  files: ChangeFile[],
  extraPaths: string[] = []
): Promise<string | null> {
  let latest: Date | null = null;
  const paths = [...files.map((file) => file.absolutePath), ...extraPaths];

  for (const path of paths) {
    try {
      const s = await stat(path);
      if (!latest || s.mtime > latest) {
        latest = s.mtime;
      }
    } catch {
      // skip unreadable files
    }
  }
  return latest ? latest.toISOString() : null;
}

/**
 * Parse spec delta files from a change's specs/ subdirectory
 */
async function parseSpecDeltas(specsPath: string): Promise<{ data: SpecDelta[]; errors: string[] }> {
  const errors: string[] = [];
  const deltas: SpecDelta[] = [];

  try {
    const entries = await readdir(specsPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const specPath = join(specsPath, entry.name, 'spec.md');
        try {
          const content = await readFile(specPath, 'utf-8');
          const operations = parseDeltaOperations(content);

          deltas.push({
            capability: entry.name,
            content,
            operations,
          });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            errors.push(`Failed to read spec delta for ${entry.name}`);
          }
        }
      }
    }
  } catch (error) {
    // specs/ subdirectory is optional
  }

  return { data: deltas, errors };
}

/**
 * Parse delta operations (ADDED, MODIFIED, REMOVED, RENAMED) from spec content
 */
function parseDeltaOperations(content: string): DeltaOperation[] {
  const operations: DeltaOperation[] = [];
  const lines = content.split('\n');

  const sectionRegex = /^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements?/i;
  const requirementRegex = /^###\s+Requirement:\s*(.+)/i;

  let currentSection: 'added' | 'modified' | 'removed' | 'renamed' | null = null;
  let currentRequirement: { name: string; startLine: number; content: string[] } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for section headers
    const sectionMatch = line.match(sectionRegex);
    if (sectionMatch) {
      // Save previous requirement if exists
      if (currentRequirement && currentSection) {
        operations.push({
          type: currentSection,
          name: currentRequirement.name,
          content: currentRequirement.content.join('\n'),
          startLine: currentRequirement.startLine,
          endLine: i,
        });
      }
      currentSection = sectionMatch[1].toLowerCase() as 'added' | 'modified' | 'removed' | 'renamed';
      currentRequirement = null;
      continue;
    }

    // Check for requirement headers
    const reqMatch = line.match(requirementRegex);
    if (reqMatch && currentSection) {
      // Save previous requirement if exists
      if (currentRequirement) {
        operations.push({
          type: currentSection,
          name: currentRequirement.name,
          content: currentRequirement.content.join('\n'),
          startLine: currentRequirement.startLine,
          endLine: i,
        });
      }
      currentRequirement = {
        name: reqMatch[1].trim(),
        startLine: i + 1,
        content: [line],
      };
      continue;
    }

    // Add line to current requirement content
    if (currentRequirement) {
      currentRequirement.content.push(line);
    }
  }

  // Don't forget the last requirement
  if (currentRequirement && currentSection) {
    operations.push({
      type: currentSection,
      name: currentRequirement.name,
      content: currentRequirement.content.join('\n'),
      startLine: currentRequirement.startLine,
      endLine: lines.length,
    });
  }

  return operations;
}

/**
 * Parse a single change by name
 */
export async function parseChangeByName(
  openspecPath: string,
  changeName: string
): Promise<ParseResult<Change>> {
  const changesPath = join(openspecPath, 'changes');

  // Try active changes first
  const activePath = join(changesPath, changeName);
  try {
    const stats = await stat(activePath);
    if (stats.isDirectory()) {
      return parseChange(changeName, activePath, false);
    }
  } catch (error) {
    // Not in active, try archive
  }

  // Try archived changes
  const archivePath = join(changesPath, 'archive');
  try {
    const entries = await readdir(archivePath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.includes(changeName)) {
        return parseChange(entry.name, join(archivePath, entry.name), true);
      }
    }
  } catch (error) {
    // Archive doesn't exist
  }

  return {
    data: null,
    errors: [`Change ${changeName} not found`],
    warnings: [],
  };
}
