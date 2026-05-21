# Feature: Unify Explorer Flush List Layout

## Summary

Update the default Explorer Pane sections—Active Changes, Archive, and Specs—to use the same flush, full-width list language already used by the Search and Validation panels. The section group should read as one dense explorer surface with clear section headers instead of three separated card containers.

## Motivation

The current default Explorer view renders Active Changes, Archive, and Specs as separate rounded cards with outer padding and inter-section spacing. That card chrome consumes horizontal space, makes long change/spec names truncate earlier, and visually diverges from the more readable Search and Validation list panels.

Users have found the Search and Validation list treatment easier to scan. Aligning the default Explorer sections with that treatment should improve density, increase usable row width, and make navigation feel more consistent across Explorer modes.

## Proposed Solution

Convert the default Explorer section group from a spaced card stack into a flush list layout:

- Remove or sharply reduce the outer section-group padding and `space-y` gaps between Active Changes, Archive, and Specs.
- Remove rounded card-style section containers in the default Explorer group.
- Keep collapsible section headers, icons, counts, sort controls, and Active Changes command shortcuts.
- Use full-width section headers with subtle separators and enough visual weight to preserve section wayfinding.
- Keep existing Explorer list item behavior, context menus, preview/confirmed tab behavior, validation icons, progress metadata, empty states, and project footer behavior.
- Represent focused sections without relying on a card-wide ring, for example through header/accent styling.

## Alternatives Considered

- **Keep cards but reduce spacing**: lower implementation risk and preserves current boundaries, but only partially recovers horizontal width and still diverges from Search/Validation.
- **Make all section headers sticky**: improves wayfinding for long lists, but adds more layout complexity and is not required for the initial readability improvement.
- **Unify by changing Search/Validation to cards**: would reduce consistency with the list surfaces users already prefer and would worsen density.

## Impact

- [ ] Breaking changes
- [ ] Database migrations
- [ ] API changes

Expected frontend impact:

- `ExplorerPane.svelte` default-section wrapper spacing/padding changes.
- `ExplorerSection` visual treatment changes or gains a flush/default-list presentation path.
- Existing tests around Explorer sections may need selector or class expectation updates.
