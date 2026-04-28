import { readFile } from 'fs/promises';
import { join, basename, resolve, dirname } from 'path';
import { parseDocument } from 'yaml';
import type {
  InvalidPlanningContext,
  LegacyProjectDoc,
  PlanningContextRule,
  PlanningContextSection,
  PlanningContextSource,
  ParsedPlanningContext,
  Project,
  ProjectMigrationState,
  ParseResult,
} from '../shared/types.js';

interface ParsedConfigFile {
  schema?: unknown;
  context?: unknown;
  rules?: unknown;
}

function folderNameToProjectName(folderName: string): string {
  return folderName.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function humanizeArtifactId(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getFirstNonEmptyLine(value: string): string {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? '';
}

function stringifyRuleValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyRuleValue(item))
      .filter((item) => item.length > 0)
      .join('\n');
  }

  return JSON.stringify(value, null, 2);
}

function normalizeRules(value: unknown): PlanningContextSection[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value as Record<string, unknown>)
    .map(([artifactId, rawRules]) => {
      if (rawRules && typeof rawRules === 'object' && !Array.isArray(rawRules)) {
        const items = Object.entries(rawRules as Record<string, unknown>)
          .map(([label, itemValue]) => ({
            label,
            value: stringifyRuleValue(itemValue),
          }))
          .filter((item) => item.value.length > 0);

        if (items.length > 0) {
          return {
            artifactId,
            title: humanizeArtifactId(artifactId),
            content: items.map((item) => `${item.label}:\n${item.value}`).join('\n\n'),
            items,
          } satisfies PlanningContextSection;
        }
      }

      const content = stringifyRuleValue(rawRules);
      if (!content) {
        return null;
      }

      return {
        artifactId,
        title: humanizeArtifactId(artifactId),
        content,
        items: [{ label: 'rule', value: content }] satisfies PlanningContextRule[],
      } satisfies PlanningContextSection;
    })
    .filter((section): section is PlanningContextSection => section !== null);
}

function extractLegacyDescription(content: string): string {
  const descMatch = content.match(/^#\s+.+\n+(.+?)(?:\n\n|\n#|$)/s);
  return descMatch ? descMatch[1].trim() : '';
}

async function readOptionalLegacyProjectDoc(projectPath: string, warnings: string[]): Promise<LegacyProjectDoc | null> {
  try {
    const content = await readFile(projectPath, 'utf-8');
    return {
      path: projectPath,
      content,
      description: extractLegacyDescription(content),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      warnings.push('project.md not found');
      return null;
    }

    throw error;
  }
}

function determineMigrationState(aiContext: string, legacyProjectDoc: LegacyProjectDoc | null): ProjectMigrationState {
  if (!legacyProjectDoc) {
    return 'config-only';
  }

  return aiContext.length > 0 ? 'legacy-present' : 'migration-needed';
}

function buildCompatibilityContent(options: {
  configPath: string;
  schema: string;
  aiContext: string;
  artifactRules: PlanningContextSection[];
  legacyProjectDoc: LegacyProjectDoc | null;
}): string {
  const sections: string[] = [`# OpenSpec Planning Context`, '', `Source: ${options.configPath}`];

  sections.push('', '## AI Context', '', options.aiContext || '_No AI context configured._');

  sections.push('', '## Artifact Rules');
  if (options.artifactRules.length === 0) {
    sections.push('', '_No artifact-specific rules._');
  } else {
    for (const section of options.artifactRules) {
      sections.push('', `### ${section.title}`, '', section.content);
    }
  }

  sections.push('', '## Workflow Schema', '', options.schema || '_No schema configured._');

  if (options.legacyProjectDoc) {
    sections.push('', '## Legacy project.md (Deprecated)', '', options.legacyProjectDoc.content);
  }

  return `${sections.join('\n').trimEnd()}\n`;
}

function buildInvalidCompatibilityContent(options: {
  configPath: string;
  rawConfig: string;
  parseErrors: string[];
  legacyProjectDoc: LegacyProjectDoc | null;
}): string {
  const sections: string[] = [
    '# OpenSpec Planning Context',
    '',
    `Source: ${options.configPath}`,
    '',
    '## Config Status',
    '',
    'Invalid config.yaml',
    '',
    '## Parse Errors',
  ];

  if (options.parseErrors.length === 0) {
    sections.push('', '_No parse error details available._');
  } else {
    for (const error of options.parseErrors) {
      sections.push('', error);
    }
  }

  sections.push('', '## Raw config.yaml', '', '```yaml', options.rawConfig.trimEnd(), '```');

  if (options.legacyProjectDoc) {
    sections.push('', '## Legacy project.md (Deprecated)', '', options.legacyProjectDoc.content);
  }

  return `${sections.join('\n').trimEnd()}\n`;
}

function formatYamlIssues(issues: Array<{ message: string }>): string[] {
  return issues
    .map((issue) => issue.message.trim())
    .filter((message) => message.length > 0);
}

export async function parseProject(openspecPath: string): Promise<ParseResult<Project>> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const configPath = join(openspecPath, 'config.yaml');
  const projectPath = join(openspecPath, 'project.md');
  const projectRoot = dirname(resolve(openspecPath));
  const folderName = basename(projectRoot);
  const name = folderNameToProjectName(folderName);

  try {
    const configContent = await readFile(configPath, 'utf-8');
    const legacyProjectDoc = await readOptionalLegacyProjectDoc(projectPath, warnings);
    const document = parseDocument(configContent);
    warnings.push(...formatYamlIssues(document.warnings));

    if (document.errors.length > 0) {
      const parseErrors = formatYamlIssues(document.errors);
      errors.push(...parseErrors);

      const planningContext: InvalidPlanningContext = {
        source: {
          path: configPath,
          type: 'config' satisfies PlanningContextSource['type'],
        },
        status: 'invalid',
        rawConfig: configContent,
        parseErrors,
      };

      return {
        data: {
          name,
          description: '',
          path: configPath,
          content: buildInvalidCompatibilityContent({
            configPath,
            rawConfig: configContent,
            parseErrors,
            legacyProjectDoc,
          }),
          planningContext,
          legacyProjectDoc,
          migrationState: determineMigrationState('', legacyProjectDoc),
        },
        errors,
        warnings,
      };
    }

    const parsedConfig = (document.toJS() ?? {}) as ParsedConfigFile;
    const aiContext = normalizeText(parsedConfig.context);
    const schema = normalizeText(parsedConfig.schema);
    const artifactRules = normalizeRules(parsedConfig.rules);
    const migrationState = determineMigrationState(aiContext, legacyProjectDoc);
    const description = getFirstNonEmptyLine(aiContext);
    const content = buildCompatibilityContent({
      configPath,
      schema,
      aiContext,
      artifactRules,
      legacyProjectDoc,
    });
    const planningContext: ParsedPlanningContext = {
      source: {
        path: configPath,
        type: 'config' satisfies PlanningContextSource['type'],
      },
      status: 'parsed',
      aiContext,
      artifactRules,
      workflowSchema: schema,
    };

    return {
      data: {
        name,
        description,
        path: configPath,
        content,
        planningContext,
        legacyProjectDoc,
        migrationState,
      },
      errors,
      warnings,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      errors.push('config.yaml not found');
      return { data: null, errors, warnings };
    }

    errors.push(`Failed to read config.yaml: ${error}`);
    return { data: null, errors, warnings };
  }
}
