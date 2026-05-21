# Feature: Reduce UI Radius for Solid Surfaces

## Summary

Refine the WebUI visual system toward a more solid, less rounded interface. Keep modest rounding on major outer containers, but reduce nested rounding and pill-heavy treatment inside dashboard sections, settings surfaces, callouts, lists, badges, icon boxes, and shared surface primitives.

## Motivation

After the Explorer default sections moved toward a flush list layout, the Dashboard, Settings page, and several shared surfaces still feel comparatively soft and busy: rounded outer cards contain rounded inner cards, rounded option cards, rounded callouts, rounded icon boxes, pill badges, and hover lift effects. This creates stacked visual chrome and makes information-dense OpenSpec views feel more decorative than tool-like.

A clearer radius hierarchy should make the UI calmer: outer shells can define grouping, while inner rows/items use straighter edges, separators, and background/border states.

## Proposed Solution

Introduce a restrained radius direction across shared UI surfaces:

- Preserve subtle rounding on major shells such as dashboard `SurfaceCard` containers and dialogs.
- Reduce inner item rounding in dashboard Active Changes and Recent Activity while preserving bounded task-card grouping for compound Active Changes rows that include a `Next Step` sub-row.
- Prefer separators, borders, and background hover states over nested shadows and hover translation.
- Reduce overly pill-like treatment for badges/chips where a rectangular label works better.
- Normalize `IconBox`, `InteractiveCard`, `InsetPanel`, `Callout`, `OptionCard`, Settings grouped lists, and related shared primitives around a small set of radius levels.
- Keep behavior, information hierarchy, navigation, context menus, validation indicators, and localization unchanged.

## Alternatives Considered

- **Make everything square**: too harsh and would lose the approachable grouped-shell look.
- **Only change Dashboard manually**: quick, but leaves shared primitives with inconsistent radius defaults that will recreate the problem elsewhere.
- **Keep current card-heavy style**: avoids visual churn, but conflicts with the newly denser Explorer direction and keeps nested chrome.

## Impact

- [ ] Breaking changes
- [ ] Database migrations
- [ ] API changes

Expected frontend impact:

- Shared surface primitives may gain adjusted radius defaults or explicit radius variants.
- Dashboard summary cards, bounded Active Changes task cards, Recent Activity items, Planning Context inset content, Callouts, OptionCards, and Settings grouped controls may need class updates.
- Visual snapshot/class-based tests may need updates if they assert rounded classes or card structure.
