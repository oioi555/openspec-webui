# Feature: Add explorer list validation icons

## Summary

Add compact right-aligned validation icons to Explorer list rows where validation state helps scanning, while excluding surfaces whose targets cannot or should not be interpreted from the latest validation run.

## Motivation

The Explorer already exposes validation in dedicated places, but operators still need a faster way to spot attention items while scanning Active Changes, Specs, and Search results. At the same time, archived changes should not show validation status because OpenSpec validation does not evaluate archive entries, and showing speculative states there would be misleading.

The desired behavior is intentionally asymmetric:

- Active Changes should show `failed`, `warning`, `info`, and `passed`.
- Archive should show nothing.
- Specs should show only `failed`, `warning`, and `info` so the list does not become a wall of pass icons.
- Search should mirror those same rules based on the resolved result kind.
- Validation rows already show status and should not gain another trailing icon.

## Proposed Solution

- Extend the shared Explorer list row plumbing so a first-line trailing accessory can render at the far right without changing row selection or context-menu behavior.
- Reuse `StatusIndicator`'s unused `minimal` format as a colored icon-only presentation for compact list rows.
- Derive a displayable validation icon state per row from the existing validation store and shared status semantics.
- Apply the icon rules by target kind rather than by panel:
  - active change: show `failed`, `warning`, `info`, `passed`
  - archived change: show nothing
  - spec: show `failed`, `warning`, `info`
  - search result: resolve underlying entity kind first, then apply the same rule as that kind
  - validation panel rows: unchanged
- Keep `not-run`, `stale`, and `unknown` hidden in these lists so the Explorer does not imply meaning where the latest validation run is incomplete, missing, or inapplicable.

## Alternatives Considered

### Show icons in every list including Archive

Rejected because archived changes are outside the validation target set and would mostly produce misleading or unhelpful states.

### Show pass icons for Specs too

Rejected because the Specs list is denser and would become visually noisy. The main value there is surfacing exceptions.

### Add a brand-new icon-only status format

Rejected for now because `StatusIndicator format="minimal"` is currently unused in the repository, so redefining it as the compact colored icon-only format is lower-cost and preserves a clean three-level density model: `badge`, `icon-box`, `minimal`.

## Impact

- [ ] Breaking changes
- [ ] Database migrations
- [ ] API changes

Affected capabilities:

- `shared-ui-parts`
- `change-browsing`
- `spec-browsing`
- `search`
