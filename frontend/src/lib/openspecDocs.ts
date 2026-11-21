/**
 * Official OpenSpec documentation links (https://openspec.dev/docs). Every
 * OpenSpec docs link in the UI is defined here.
 */
const OPENSPEC_DOCS_BASE = 'https://openspec.dev/docs';

export const OPENSPEC_INSTALL_DOCS_URL = `${OPENSPEC_DOCS_BASE}/installation`;
export const OPENSPEC_SETUP_DOCS_URL = `${OPENSPEC_DOCS_BASE}/setup`;
export const OPENSPEC_INIT_DOCS_URL = `${OPENSPEC_DOCS_BASE}/cli#openspec-init`;
export const OPENSPEC_SUPPORTED_TOOLS_DOCS_URL = `${OPENSPEC_DOCS_BASE}/supported-tools`;
/** Workflow skills reference (the retired 1.x Commands page has no 2.x successor). */
export const OPENSPEC_COMMANDS_DOCS_URL = `${OPENSPEC_DOCS_BASE}/skills`;
/** Core and optional workflow sets. */
export const OPENSPEC_WORKFLOWS_DOCS_URL = `${OPENSPEC_DOCS_BASE}/profiles`;
/** `openspec init --language` is documented in the init reference. */
export const OPENSPEC_MULTI_LANGUAGE_DOCS_URL = `${OPENSPEC_DOCS_BASE}/cli#openspec-init`;
export const OPENSPEC_STORES_GUIDE_URL = `${OPENSPEC_DOCS_BASE}/stores`;
export const OPENSPEC_STORE_CLI_REFERENCE_URL = `${OPENSPEC_DOCS_BASE}/cli#openspec-store`;

/** Every documentation link above, for link checks. */
export const OPENSPEC_DOCS_URLS: readonly string[] = [
  OPENSPEC_INSTALL_DOCS_URL,
  OPENSPEC_SETUP_DOCS_URL,
  OPENSPEC_INIT_DOCS_URL,
  OPENSPEC_SUPPORTED_TOOLS_DOCS_URL,
  OPENSPEC_COMMANDS_DOCS_URL,
  OPENSPEC_WORKFLOWS_DOCS_URL,
  OPENSPEC_MULTI_LANGUAGE_DOCS_URL,
  OPENSPEC_STORES_GUIDE_URL,
  OPENSPEC_STORE_CLI_REFERENCE_URL,
];
