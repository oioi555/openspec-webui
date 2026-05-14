import type { SearchResult, ValidationItemType } from './types/api';
import type { WorkflowCommand } from './types/commandTypes';

export const FIXED_LABELS = {
  appName: 'OpenSpec WebUI',
  common: {
    active: 'Active',
    add: 'Add',
    archive: 'Archive',
    archived: 'Archived',
    cancel: 'Cancel',
    close: 'Close',
    copy: 'Copy',
    currentProject: 'Current Project',
    date: 'Date',
    dashboard: 'Dashboard',
    design: 'Design',
    error: 'Error',
    info: 'Info',
    loading: 'Loading...',
    name: 'Name',
    nextStep: 'Next Step',
    path: 'Path',
    progress: 'Progress',
    quoteCopy: 'Quote Copy',
    remove: 'Remove',
    retry: 'Retry',
    search: 'Search',
    settings: 'Settings',
    specs: 'Specs',
    validate: 'Validate',
    yes: 'Yes',
  },
  activityBar: {
    collapseExplorer: 'Collapse explorer',
    expandExplorer: 'Expand explorer',
    openProjectSelector: 'Open project selector',
  },
  layout: {
    explorer: 'Explorer',
  },
  search: {
    clear: 'Clear search',
    explorerDescription: 'Keep results here while opening matching documents in the main tabs.',
    explorerHeading: 'Workspace Search',
    noResults: (query: string) => `No results for "${query}"`,
    title: 'Search',
    placeholder: 'Search workspace...',
    relatedChanges: 'Search changes related to this spec',
    resultCount: (count: number) => `${count} result${count === 1 ? '' : 's'}`,
    startTyping: 'Type at least 2 characters to search.',
    types: {
      change: 'Change',
      project: 'Project',
      spec: 'Spec',
    },
  },
  projectSelector: {
    title: 'Project Selector',
    yourProjects: 'Your Projects',
    switching: 'Switching...',
    addNewProject: 'Add New Project',
    removeConfirm: 'Remove?',
    removeProject: 'Remove project',
  },
  addProject: {
    title: 'Add Project',
    goBack: 'Go back',
    goParent: 'Go to parent',
    addThisDirectory: 'Add This Directory',
    manualEntry: 'Or enter path manually',
    manualPlaceholder: '/absolute/path/to/project',
  },
  emptyProject: {
    title: 'No Active Project',
    addProject: 'Add Project',
  },
  settings: {
    title: 'Settings',
    sections: {
      general: 'General',
      workflow: 'Workflow',
      commands: 'Commands',
      validation: 'Validation',
      versions: 'Versions',
    },
    headings: {
      language: 'Language',
      theme: 'Theme',
      explorer: 'Explorer',
      workflow: 'Workflow',
      commands: 'Commands',
      validation: 'Validation',
      versions: 'Versions',
      coreCommands: 'Core Commands',
      expandedCommands: 'Expanded Commands',
    },
    themeOptions: {
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    },
    enablePreviewTabs: 'Enable preview tabs',
    docs: {
      opsxReference: 'OPSX Reference',
      supportedTools: 'Supported Tools',
      commands: 'Commands',
      workflows: 'Workflows',
    },
    workflowFormats: {
      standard: 'Standard',
      claudeCode: 'Claude Code',
      skill: 'Skill',
    },
    workspaceCommand: 'Workspace',
    changeCommand: 'Change',
    versions: {
      webui: 'OpenSpec WebUI',
      openspecCli: 'OpenSpec CLI',
      current: 'Current',
      latest: 'Latest',
      status: 'Status',
      updateCommand: 'Update Command',
      projectCommand: 'Project Command',
      releases: 'Releases',
      projectsToUpdate: 'Projects to Update',
      upToDate: 'Up to date',
      updateAvailable: 'Update available',
      unavailable: 'Unavailable',
      unknown: 'Unknown',
      notInstalled: 'Not installed',
      afterUpdatingOpenSpec: 'After updating OpenSpec CLI',
    },
  },
  workflowCommands: {
    propose: 'Propose',
    explore: 'Explore',
    apply: 'Apply',
    archive: 'Archive',
    new: 'New',
    continue: 'Continue',
    ff: 'Fast Forward',
    verify: 'Verify',
    sync: 'Sync',
    bulkArchive: 'Bulk Archive',
  },
  dashboard: {
    openProjectSelector: 'Open project selector',
    activeChanges: 'Active Changes',
    tasks: 'Tasks',
    recentActivity: 'Recent Activity',
    planningContext: 'OpenSpec Planning Context',
    focusSection: 'Focus section',
    migrationNeeded: 'Migration needed',
    legacyDetected: 'Legacy project.md detected',
    invalidConfig: 'Invalid config.yaml',
    aiContext: 'AI Context',
    artifactRules: 'Artifact Rules',
    parseErrors: 'Parse Errors',
    rawConfig: 'Raw config.yaml',
    workflowSchema: 'Workflow Schema',
    proposal: 'Proposal',
    badges: {
      activeChange: 'Active change',
      archived: 'Archived',
      spec: 'Spec',
      legacy: 'Legacy',
    },
    legacyProjectDoc: 'Legacy project.md (Deprecated)',
  },
  explorer: {
    activeChanges: 'Active Changes',
    archive: 'Archive',
    specs: 'Specs',
    validate: 'Validation',
    sortBy: 'Sort by',
  },
  validation: {
    title: 'Validation',
    description: 'Run strict validation for the active project and keep failures visible here while opening related specs and changes in the main tabs.',
    run: 'Run Validate',
    running: 'Running validation…',
    start: 'Run validation for the active project.',
    passed: 'Validation passed',
    failed: 'Validation failed',
    failedItems: 'Failed Items',
    summary: 'Summary',
    lastRun: 'Last run',
    commandError: 'Command Error',
    noFailedItems: 'No failed validation items.',
    nonNavigable: 'This item is visible for review but does not open a spec or change tab.',
    strict: 'Strict',
    autoRun: 'Auto-run',
    concurrency: 'Concurrency',
    commandPreview: (args: string) => args,
    issueCount: (count: number) => `${count} issue${count === 1 ? '' : 's'}`,
    summaryCounts: (passed: number, failed: number, total: number) => `${passed} passed • ${failed} failed • ${total} total`,
    typeLabels: {
      spec: 'Spec',
      change: 'Change',
      project: 'Project',
      unknown: 'Other',
    },
    viewer: {
      details: 'Details',
      hideDetails: 'Hide details',
      rerun: 'Re-run validation',
      rerunning: 'Re-running validation',
      labels: {
        notRun: 'Not run',
        passed: 'Passed',
        warning: 'Warning',
        failed: 'Failed',
        stale: 'Stale',
        unknown: 'Unknown',
      },
      descriptions: {
        notRun: 'Run validation from the Validation panel to view this item status.',
        passed: 'No validation issues in the latest run.',
        stale: 'The latest validation run did not include this item.',
        unknown: 'Validation status is unavailable right now.',
      },
      issueCount: (count: number) => `${count} issue${count === 1 ? '' : 's'}`,
      statusAria: (typeLabel: string, name: string, stateLabel: string) => `${typeLabel} ${name} validation status: ${stateLabel}`,
      detailsAria: (typeLabel: string, name: string, expanded: boolean) =>
        `${expanded ? 'Hide' : 'Show'} validation details for ${typeLabel} ${name}`,
    },
  },
  viewer: {
    specification: 'Specification',
    specDeltas: 'Spec Deltas',
  },
  tab: {
    preview: 'Preview',
    unpinAria: 'Unpin tab',
    closeAria: 'Close tab',
  },
} as const;

export function getWorkflowCommandLabel(command: WorkflowCommand): string {
  switch (command) {
    case 'propose':
      return FIXED_LABELS.workflowCommands.propose;
    case 'explore':
      return FIXED_LABELS.workflowCommands.explore;
    case 'apply':
      return FIXED_LABELS.workflowCommands.apply;
    case 'archive':
      return FIXED_LABELS.workflowCommands.archive;
    case 'new':
      return FIXED_LABELS.workflowCommands.new;
    case 'continue':
      return FIXED_LABELS.workflowCommands.continue;
    case 'ff':
      return FIXED_LABELS.workflowCommands.ff;
    case 'verify':
      return FIXED_LABELS.workflowCommands.verify;
    case 'sync':
      return FIXED_LABELS.workflowCommands.sync;
    case 'bulk-archive':
      return FIXED_LABELS.workflowCommands.bulkArchive;
  }
}

export function getSearchResultTypeLabel(type: SearchResult['type']): string {
  switch (type) {
    case 'spec':
      return FIXED_LABELS.search.types.spec;
    case 'change':
      return FIXED_LABELS.search.types.change;
    case 'project':
      return FIXED_LABELS.search.types.project;
  }
}

export function getValidationItemTypeLabel(type: ValidationItemType): string {
  switch (type) {
    case 'spec':
      return FIXED_LABELS.validation.typeLabels.spec;
    case 'change':
      return FIXED_LABELS.validation.typeLabels.change;
    case 'project':
      return FIXED_LABELS.validation.typeLabels.project;
    case 'unknown':
      return FIXED_LABELS.validation.typeLabels.unknown;
  }
}

export function getSpecDeltaCountLabel(count: number): string {
  return `${count} spec delta${count === 1 ? '' : 's'}`;
}

export function getChangeTaskCountLabel(done: number, total: number): string {
  return `${done}/${total} tasks`;
}

export function getChangeTaskCountCompleteLabel(done: number, total: number): string {
  return `${done}/${total} tasks complete`;
}

export function getCommandShortcutCopyTitle(command: string): string {
  return `Copy ${command}`;
}

export function getPreviewTabAriaLabel(label: string): string {
  return `${label} Preview tab`;
}

export function getRegularTabAriaLabel(label: string): string {
  return `${label} tab`;
}

export function getPinnedTabAriaLabel(label: string): string {
  return `Pinned ${label} tab`;
}

export function getWorkflowSchemaFallbackLabel(): string {
  return 'No schema configured';
}
