import { isApiErrorCode } from './api';
export {
  OPENSPEC_INSTALL_DOCS_URL,
  OPENSPEC_SETUP_DOCS_URL,
} from './openspecDocs';

const MISSING_OPEN_SPEC_INITIALIZATION_PREFIX = 'OpenSpec project not found at ';

export function isMissingOpenSpecInitializationMessage(message: string | null | undefined): boolean {
  return typeof message === 'string' && message.startsWith(MISSING_OPEN_SPEC_INITIALIZATION_PREFIX);
}

export function shouldShowProjectInitGuidance(
  errorCause: unknown,
  errorMessage: string | null | undefined
): boolean {
  if (isApiErrorCode(errorCause, 'INVALID_PROJECT_PATH')) {
    if (typeof errorCause.metadata?.openspecPath === 'string' && errorCause.metadata.openspecPath.length > 0) {
      return true;
    }

    return isMissingOpenSpecInitializationMessage(errorCause.message);
  }

  return isMissingOpenSpecInitializationMessage(errorMessage);
}
