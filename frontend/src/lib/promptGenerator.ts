import type { Suggestion } from '../stores/suggestions.svelte.ts';
import type { Change, ChangeFile } from './api';

interface SuggestionLocation {
  fileName: string;
  filePath: string;
  lineNumber: number | null;
}

/**
 * Find which file contains the original text and calculate line number
 */
function findSuggestionLocation(
  originalText: string,
  change: Change
): SuggestionLocation | null {
  // Search through all file groups
  for (const group of change.fileGroups) {
    for (const file of group.files) {
      if (file.type === 'markdown' && file.content) {
        const index = file.content.indexOf(originalText);
        if (index !== -1) {
          // Calculate line number
          const linesBeforeMatch = file.content.substring(0, index).split('\n');
          const lineNumber = linesBeforeMatch.length;

          return {
            fileName: file.name,
            filePath: file.path,
            lineNumber,
          };
        }
      }
    }
  }

  // Also check spec deltas
  for (const delta of change.specDeltas) {
    const index = delta.content.indexOf(originalText);
    if (index !== -1) {
      const linesBeforeMatch = delta.content.substring(0, index).split('\n');
      const lineNumber = linesBeforeMatch.length;

      return {
        fileName: `specs/${delta.capability}.md`,
        filePath: `specs/${delta.capability}.md`,
        lineNumber,
      };
    }
  }

  return null;
}

/**
 * Generate an implementation prompt with all suggestions for a change
 */
export function generatePrompt(
  changeName: string,
  change: Change,
  suggestions: Suggestion[]
): string {
  const suggestionBlocks = suggestions
    .map((suggestion, index) => {
      const location = findSuggestionLocation(suggestion.originalText, change);

      let locationInfo = '';
      if (location) {
        locationInfo = `**File:** \`${location.filePath}\``;
        if (location.lineNumber) {
          locationInfo += ` (line ${location.lineNumber})`;
        }
        locationInfo += '\n';
      }

      return `### Suggestion ${index + 1}
${locationInfo}
**Original text:**
> ${suggestion.originalText}

**Suggested change:**
${suggestion.suggestedChange}`;
    })
    .join('\n\n');

  return `I'm reviewing the change "${changeName}" and have the following suggestions:

## Suggestions

${suggestionBlocks}

---

Please update the referenced files to incorporate these suggestions.`;
}
