import type { ActivityPreset, ResponsiveMode } from '../../state/layout.svelte.ts';

export type ActivityBarActiveSection = ActivityPreset | 'settings';

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
