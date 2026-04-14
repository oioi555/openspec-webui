export const EMPTY_SELECTION_MESSAGE = 'No text selected';

export type CopySelectionResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export type SpecViewerTab = 'spec' | 'design';

export function buildCopySelectionResult(selection: string | null | undefined): CopySelectionResult {
  const text = selection ?? '';
  if (!text) {
    return { ok: false, error: EMPTY_SELECTION_MESSAGE };
  }

  return { ok: true, text };
}

export function buildQuotedCopySelectionResult(options: {
  sourceName: string;
  contextLabel: string;
  selection: string | null | undefined;
}): CopySelectionResult {
  const selectionResult = buildCopySelectionResult(options.selection);
  if (!selectionResult.ok) {
    return selectionResult;
  }

  const quotedLines = selectionResult.text
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');

  return {
    ok: true,
    text: `> [${options.sourceName}] ${options.contextLabel}\n${quotedLines}`,
  };
}

export function getChangeViewerContextLabel(options: {
  activeFileName?: string | null;
  deltaCapability?: string | null;
}): string {
  return options.deltaCapability ?? options.activeFileName ?? '';
}

export function getSpecViewerContextLabel(activeTab: SpecViewerTab): 'Specification' | 'Design' {
  return activeTab === 'design' ? 'Design' : 'Specification';
}
