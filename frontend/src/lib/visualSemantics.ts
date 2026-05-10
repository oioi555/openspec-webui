import type { Component } from 'svelte';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileText,
  Folder,
  Info,
  SquarePen,
  XCircle,
} from '@lucide/svelte';
import { FIXED_LABELS } from './uiText';

export type IconComponent = Component<{ class?: string }>;
export type IconBoxVariant = 'info' | 'success' | 'muted' | 'warning' | 'danger';
export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'info' | 'destructive';

export type EntityKind = 'spec' | 'active-change' | 'archived-change' | 'project' | 'unknown';

export interface EntityVisualMeta {
  icon: IconComponent;
  label: string;
  iconBoxVariant: IconBoxVariant;
  badgeVariant: BadgeVariant;
  iconClass: string;
  muted: boolean;
}

export const entityVisuals: Record<EntityKind, EntityVisualMeta> = {
  spec: {
    icon: FileText,
    label: FIXED_LABELS.search.types.spec,
    iconBoxVariant: 'success',
    badgeVariant: 'success',
    iconClass: 'text-success',
    muted: false,
  },
  'active-change': {
    icon: SquarePen,
    label: FIXED_LABELS.search.types.change,
    iconBoxVariant: 'info',
    badgeVariant: 'outline',
    iconClass: 'text-info',
    muted: false,
  },
  'archived-change': {
    icon: Archive,
    label: FIXED_LABELS.common.archived,
    iconBoxVariant: 'muted',
    badgeVariant: 'secondary',
    iconClass: 'text-muted-foreground',
    muted: true,
  },
  project: {
    icon: Folder,
    label: FIXED_LABELS.search.types.project,
    iconBoxVariant: 'warning',
    badgeVariant: 'secondary',
    iconClass: 'text-warning',
    muted: false,
  },
  unknown: {
    icon: CircleHelp,
    label: FIXED_LABELS.validation.typeLabels.unknown,
    iconBoxVariant: 'muted',
    badgeVariant: 'secondary',
    iconClass: 'text-muted-foreground',
    muted: true,
  },
};

export function getEntityVisual(kind: EntityKind): EntityVisualMeta {
  return entityVisuals[kind];
}

export type ValidationSeverityKind = 'error' | 'warning' | 'info';

export interface ValidationSeverityVisualMeta {
  icon: IconComponent;
  label: string;
  iconBoxVariant: IconBoxVariant;
  badgeVariant: BadgeVariant;
}

export const validationSeverityVisuals: Record<ValidationSeverityKind, ValidationSeverityVisualMeta> = {
  error: {
    icon: XCircle,
    label: FIXED_LABELS.common.error,
    iconBoxVariant: 'danger',
    badgeVariant: 'destructive',
  },
  warning: {
    icon: AlertTriangle,
    label: FIXED_LABELS.validation.viewer.labels.warning,
    iconBoxVariant: 'warning',
    badgeVariant: 'warning',
  },
  info: {
    icon: Info,
    label: FIXED_LABELS.common.info,
    iconBoxVariant: 'info',
    badgeVariant: 'info',
  },
};

export function normalizeValidationSeverity(level: string): ValidationSeverityKind {
  if (level === 'WARNING') {
    return 'warning';
  }

  if (level === 'INFO') {
    return 'info';
  }

  return 'error';
}

export function getValidationSeverityVisual(level: string): ValidationSeverityVisualMeta {
  return validationSeverityVisuals[normalizeValidationSeverity(level)];
}

export type ValidationStatusKind = 'not-run' | 'running' | 'passed' | 'info' | 'failed' | 'warning' | 'stale' | 'unknown';

export interface ValidationStatusVisualMeta {
  icon: IconComponent;
  label: string;
  iconBoxVariant: IconBoxVariant;
  badgeVariant: BadgeVariant;
}

export const validationStatusVisuals: Record<ValidationStatusKind, ValidationStatusVisualMeta> = {
  'not-run': {
    icon: Clock3,
    label: FIXED_LABELS.validation.viewer.labels.notRun,
    iconBoxVariant: 'muted',
    badgeVariant: 'secondary',
  },
  running: {
    icon: Clock3,
    label: FIXED_LABELS.validation.running,
    iconBoxVariant: 'info',
    badgeVariant: 'default',
  },
  passed: {
    icon: CheckCircle2,
    label: FIXED_LABELS.validation.viewer.labels.passed,
    iconBoxVariant: 'success',
    badgeVariant: 'success',
  },
  info: {
    icon: Info,
    label: FIXED_LABELS.common.info,
    iconBoxVariant: 'info',
    badgeVariant: 'info',
  },
  failed: {
    icon: AlertTriangle,
    label: FIXED_LABELS.validation.viewer.labels.failed,
    iconBoxVariant: 'danger',
    badgeVariant: 'destructive',
  },
  warning: {
    icon: AlertTriangle,
    label: FIXED_LABELS.validation.viewer.labels.warning,
    iconBoxVariant: 'warning',
    badgeVariant: 'warning',
  },
  stale: {
    icon: Clock3,
    label: FIXED_LABELS.validation.viewer.labels.stale,
    iconBoxVariant: 'muted',
    badgeVariant: 'secondary',
  },
  unknown: {
    icon: CircleHelp,
    label: FIXED_LABELS.validation.viewer.labels.unknown,
    iconBoxVariant: 'warning',
    badgeVariant: 'warning',
  },
};

export function getValidationStatusVisual(state: ValidationStatusKind): ValidationStatusVisualMeta {
  return validationStatusVisuals[state];
}

export function getTaskProgressIconVariant(done: number, total: number): IconBoxVariant {
  if (total === 0) return 'muted';
  if (done < total) return 'warning';
  return 'success';
}
