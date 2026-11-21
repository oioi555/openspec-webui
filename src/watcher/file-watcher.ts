import chokidar, { type FSWatcher } from 'chokidar';
import { relative, sep } from 'path';

export type FileChangeHandler = (event: FileChangeEvent) => void;

export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  affectedEntity: 'project' | 'specs' | 'changes';
  entityId?: string;
}

/**
 * Create a file watcher for an OpenSpec directory
 */
export function createFileWatcher(
  openspecPath: string,
  onChange: FileChangeHandler
): FSWatcher {
  const watcher = chokidar.watch(openspecPath, {
    ignored: [
      /(^|[\/\\])\../, // Ignore dotfiles
      /node_modules/,
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  const handleFileEvent = (eventType: 'add' | 'change' | 'unlink') => (filePath: string) => {
    const relativePath = relative(openspecPath, filePath);
    const parts = relativePath.split(sep);
    const isConfigFile = parts[0] === 'config.yaml';

    if (!filePath.endsWith('.md') && !isConfigFile) {
      return;
    }

    let affectedEntity: 'project' | 'specs' | 'changes';
    let entityId: string | undefined;

    if (parts[0] === 'specs') {
      affectedEntity = 'specs';
      entityId = parts[1]; // capability name
    } else if (parts[0] === 'changes') {
      affectedEntity = 'changes';
      if (parts[1] === 'archive') {
        entityId = parts[2]; // archived change name
      } else {
        entityId = parts[1]; // active change name
      }
    } else if (parts[0] === 'project.md' || parts[0] === 'AGENTS.md' || parts[0] === 'config.yaml') {
      affectedEntity = 'project';
    } else {
      // Unsupported markdown file, treat as project
      affectedEntity = 'project';
    }

    onChange({
      type: eventType,
      path: filePath,
      affectedEntity,
      entityId,
    });
  };

  const handleDirEvent = (eventType: 'addDir' | 'unlinkDir') => (dirPath: string) => {
    const relativePath = relative(openspecPath, dirPath);
    const parts = relativePath.split(sep);

    // Only trigger for directories under specs/ or changes/
    if (parts[0] !== 'specs' && parts[0] !== 'changes') {
      return;
    }

    let affectedEntity: 'specs' | 'changes' = parts[0] as 'specs' | 'changes';
    let entityId: string | undefined;

    if (parts[0] === 'specs' && parts[1]) {
      entityId = parts[1];
    } else if (parts[0] === 'changes') {
      if (parts[1] === 'archive' && parts[2]) {
        entityId = parts[2];
      } else if (parts[1] && parts[1] !== 'archive') {
        entityId = parts[1];
      }
    }

    onChange({
      type: eventType,
      path: dirPath,
      affectedEntity,
      entityId,
    });
  };

  watcher
    .on('add', handleFileEvent('add'))
    .on('change', handleFileEvent('change'))
    .on('unlink', handleFileEvent('unlink'))
    .on('addDir', handleDirEvent('addDir'))
    .on('unlinkDir', handleDirEvent('unlinkDir'))
    .on('error', (error) => {
      // Without a listener an `error` event would throw and crash the server.
      console.warn(`[file-watcher] error watching ${openspecPath}:`, error);
    });

  return watcher;
}
