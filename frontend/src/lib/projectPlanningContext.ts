import type { Project } from './types/api';
import { FIXED_LABELS } from './uiText';

type PlanningContextNotice = {
  variant: 'error' | 'warning' | 'info' | null;
  title: string;
};

export type PlanningContextDisplayState =
  | {
      kind: 'parsed';
      notice: PlanningContextNotice;
      sourcePath: string;
      aiContext: string;
      artifactRules: Extract<Project['planningContext'], { status: 'parsed' }>['artifactRules'];
      workflowSchema: string;
    }
  | {
      kind: 'invalid';
      notice: PlanningContextNotice;
      sourcePath: string;
      parseErrors: string[];
      rawConfig: string;
    };

export function isParsedPlanningContext(
  planningContext: Project['planningContext'] | null | undefined
): planningContext is Extract<Project['planningContext'], { status: 'parsed' }> {
  return planningContext?.status === 'parsed';
}

export function isInvalidPlanningContext(
  planningContext: Project['planningContext'] | null | undefined
): planningContext is Extract<Project['planningContext'], { status: 'invalid' }> {
  return planningContext?.status === 'invalid';
}

export function getPlanningContextNotice(
  project: Pick<Project, 'migrationState' | 'planningContext'>,
  _localeVersion = 0
): PlanningContextNotice {
  if (isInvalidPlanningContext(project.planningContext)) {
    return {
      variant: 'error',
      title: FIXED_LABELS.dashboard.invalidConfig,
    };
  }

  if (project.migrationState === 'migration-needed') {
    return {
      variant: 'warning',
      title: FIXED_LABELS.dashboard.migrationNeeded,
    };
  }

  if (project.migrationState === 'legacy-present') {
    return {
      variant: 'info',
      title: FIXED_LABELS.dashboard.legacyDetected,
    };
  }

  return {
    variant: null,
    title: '',
  };
}

export function getPlanningContextDisplayState(
  project: Pick<Project, 'migrationState' | 'planningContext'>,
  localeVersion = 0
): PlanningContextDisplayState {
  const notice = getPlanningContextNotice(project, localeVersion);

  if (isInvalidPlanningContext(project.planningContext)) {
    return {
      kind: 'invalid',
      notice,
      sourcePath: project.planningContext.source.path,
      parseErrors: project.planningContext.parseErrors,
      rawConfig: project.planningContext.rawConfig,
    };
  }

  return {
    kind: 'parsed',
    notice,
    sourcePath: project.planningContext.source.path,
    aiContext: project.planningContext.aiContext,
    artifactRules: project.planningContext.artifactRules,
    workflowSchema: project.planningContext.workflowSchema,
  };
}
