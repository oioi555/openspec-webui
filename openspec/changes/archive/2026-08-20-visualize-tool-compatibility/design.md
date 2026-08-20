## Context

See `proposal.md` for motivation. The server currently carries repository-local path signatures used to detect generated Commands and Skills, while the frontend receives only integrations found in the active repository. That detector is deliberately evidence-based and must not be broadened to offer undetected tools.

OpenSpec publishes a supported-tool table containing tool ids, delivery paths, and invocation forms. Separately, AI clients document or demonstrate different levels of Agent Skills compatibility. Supporting the `SKILL.md` format does not prove that a client discovers repository-local `.agents/skills`, so these sources cannot safely be collapsed into one `supported` flag.

## Goals / Non-Goals

**Goals:**

- Make the WebUI's copied OpenSpec definition snapshot inspectable and attributable to an upstream version.
- Show the one-to-many relationship between `.agents/skills` and clients found by the current research snapshot.
- Preserve evidence quality by modeling reported path access, scope, source kind, and research metadata explicitly.
- Keep the large reference usable in a focused, responsive dialog rather than expanding the normal Tools section.

**Non-Goals:**

- Detecting installed applications, testing clients at runtime, or changing repository integration evidence.
- Automatically fetching or scraping compatibility data in the browser or server.
- Generating a personalized minimum setup command or executing `openspec init`.
- Treating an Agent Skills showcase listing as proof of `.agents/skills` path discovery.

## Decisions

### Keep official definitions and compatibility research as separate datasets

Create two server-owned read-only models:

```ts
type OpenSpecToolDefinition = {
  id: string;
  name: string;
  commands: DeliveryDefinition | null;
  skills: DeliveryDefinition | null;
};

type SharedSkillsCompatibility = {
  clientId: string;
  name: string;
  openSpecToolId?: string;
  accessMode:
    | 'native-project'
    | 'native-global'
    | 'configurable'
    | 'import'
    | 'format-only'
    | 'unverified';
  scopes: Array<'project' | 'global'>;
  evidenceKind: 'vendor-docs' | 'standard-listing' | 'research-summary' | 'runtime-observed';
  source: string;
  researchedAt: string;
  minVersion?: string;
  note?: string;
};
```

The official snapshot has table-level metadata containing the OpenSpec version, official documentation URL, and verification date. Compatibility keeps research provenance per listed client because sources and freshness differ. An `openSpecToolId` joins the views when applicable but does not imply compatibility, and the absence of a compatibility row does not imply incompatibility.

Alternative considered: one tool record with `supportsSharedAgents: boolean`. It cannot distinguish native discovery from imports or configured paths and would conflate OpenSpec support with client behavior.

### Make the copied official definition snapshot the server-side reference source

Refactor or extend the existing server-side tool signature data so the reference endpoint and repository detector consume one official-definition snapshot where their fields overlap. Include every row from the pinned OpenSpec supported-tools table, even when a row cannot produce a command shortcut, and represent missing deliveries or invocation forms explicitly.

The frontend receives the definition snapshot through a dedicated read-only reference API and does not maintain a second tool table. Compatibility data does not feed the detector or candidate generator.

Alternative considered: copy the official table into a frontend-only module. That would create another drift point beside the detector and make the requested visualization less trustworthy.

### Record compatibility as a non-exhaustive research snapshot

Create compatibility rows only for clients where the current research found useful evidence or a credible report of `.agents/skills` access. Do not require a row for every OpenSpec-supported tool and do not turn missing research into an `unverified` classification. The UI states that absence from the list is no conclusion and that listed behavior has not necessarily been reproduced by the WebUI maintainers.

The initial project-path candidate set includes major clients reported by vendor documentation, ecosystem listings, the supplied research summary, or direct runtime observation. Grok Build uses `runtime-observed` provenance for the maintainer's actual project behavior unless a durable vendor source is established. Conflicting or implementation-only findings can remain `unverified`, while configurable and import workflows retain their own modes rather than being promoted to automatic discovery.

Alternative considered: create a classification for every OpenSpec-supported tool. That creates an open-ended obligation to test the entire ecosystem and makes absence of evidence look like a compatibility decision, so the compatibility view is deliberately curated instead.

### Expose one static reference endpoint independent of active projects

Add a read-only endpoint that returns:

```text
officialDefinitions
officialSource
sharedCompatibility
```

It requires no project path and performs no filesystem scan. Static validation rejects duplicate ids, invalid access modes, official compatibility rows that reference unknown tool ids, missing evidence metadata, and an official snapshot without source metadata.

Alternative considered: append reference data to command availability. Availability is project-scoped and evidence-based; mixing static ecosystem data into it would weaken that boundary and increase every availability response.

### Use a focused dialog with two reference views

Add a compact `View tool definitions and .agents research` control to the existing Tools explanation area. It opens a modal dialog with two views:

1. **OpenSpec integrations**: searchable definitions showing id, Commands, Skills, paths, and invocation forms, plus the pinned official source.
2. **Shared `.agents` research**: a path-centered summary followed by searchable candidate rows, mode badges with text, scope, evidence, research date, and notes.

The shared summary stays compact and explains target ownership instead of repeating the researched clients listed below. The physical path is shared, but the rendered invocation contract is asymmetric:

```text
No Codex:    agents / zed ──▶ .agents/skills ──▶ /openspec-*
With Codex:  codex        ──▶ .agents/skills ──▶ $openspec-* for Codex
                                             └─▶ slash-style clients can share the Codex-led tree
```

If Codex is part of the intended client set, the user must explicitly select the `codex` OpenSpec target. Selecting only `agents` and relying on the shared physical path does not produce Codex's dollar-style workflow contract. The header does not enumerate clients because the searchable research rows immediately below already provide that information.

At desktop width use a compact table with expandable evidence details. At narrow width, stack each row as a card/list item rather than requiring the entire desktop table to fit. Long paths and invocations wrap or scroll inside their own content area while the dialog header and controls remain reachable. Center this dialog inside the application content viewport to the right of the persistent `3rem` Activity Bar, rather than across the full browser viewport.

Alternative considered: render both full tables inline in Tools. The supported set is large and would bury active-repository detection, which remains the primary Tools content.

### Preserve current detection and shortcut semantics

Opening, filtering, or closing the reference is client-local UI state. It does not refresh detection, select a tool, or create command candidates. The reference uses wording such as `discovers this path` and `OpenSpec defines this target`, never `installed` or `configured for this repository` unless that statement comes from the existing detector outside the dialog.

## Risks / Trade-offs

- [Vendor behavior changes after research] → Show research date, source kind, version when known, and keep each finding independently editable.
- [The copied OpenSpec table drifts from a newer CLI] → Pin and display its source version, test completeness against the maintained snapshot, and update it as part of CLI compatibility work.
- [Runtime-observed behavior has weaker public provenance than vendor documentation] → Label it explicitly rather than presenting it as vendor-documented; promote the evidence kind when a durable source is found.
- [A large table is difficult on mobile] → Use two focused views, search, responsive cards, and independently scrollable long values.
- [Users interpret path compatibility as full workflow validation] → State that the classification covers discovery/access only and keep invocation details and OpenSpec support separate.
- [The shared target header repeats the table and becomes visually heavy] → Keep only two target rows and one short Codex rule; leave client enumeration to the searchable rows.

## Migration Plan

1. Audit and normalize the complete OpenSpec definition snapshot, including v1.10 Zed, and add source metadata.
2. Seed the non-exhaustive compatibility snapshot from currently available research, including reported external clients such as Grok Build, without classifying every official tool.
3. Add static data validation and the independent reference API without changing command availability.
4. Build and localize the responsive dialog and add its Tools entry point.
5. Existing repository detection remains the rollback-safe path; removing the dialog and endpoint restores the prior UI without data migration.
