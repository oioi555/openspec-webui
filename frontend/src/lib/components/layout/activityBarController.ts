import type { ActivityPreset, ResponsiveMode } from '../../state/layout.svelte.ts';
import { decodeName, isArchivedChangeName } from '../../utils';

export type ActivityBarActiveSection = ActivityPreset | 'settings';

export function activitySectionFromPath(path: string, archivedChangeNames: readonly string[]): ActivityPreset {
  if (path === '/specs' || path.startsWith('/specs/')) {
    return 'specs';
  }

  if (path === '/changes') {
    return 'archive';
  }

  if (path.startsWith('/changes/')) {
    const changeName = decodeName(path.slice('/changes/'.length));
    return isArchivedChangeName(changeName, archivedChangeNames) ? 'archive' : 'home';
  }

  return 'home';
}

interface ExplorerVisibilityContext {
  hasActiveProject: boolean;
  responsiveMode: ResponsiveMode;
  explorerCollapsed: boolean;
  narrowDrawerOpen: boolean;
}

interface PresetToggleContext extends ExplorerVisibilityContext {
  preset: ActivityPreset;
  activeSection: ActivityBarActiveSection;
}

export function isActivityBarExplorerOpen({
  hasActiveProject,
  responsiveMode,
  explorerCollapsed,
  narrowDrawerOpen,
}: ExplorerVisibilityContext): boolean {
  if (!hasActiveProject) {
    return false;
  }

  return responsiveMode === 'narrow' ? narrowDrawerOpen : !explorerCollapsed;
}

export function shouldToggleCurrentPreset({
  preset,
  activeSection,
  hasActiveProject,
  responsiveMode,
  explorerCollapsed,
  narrowDrawerOpen,
}: PresetToggleContext): boolean {
  return activeSection === preset && isActivityBarExplorerOpen({
    hasActiveProject,
    responsiveMode,
    explorerCollapsed,
    narrowDrawerOpen,
  });
}
