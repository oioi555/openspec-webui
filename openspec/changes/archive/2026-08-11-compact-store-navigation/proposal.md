# Proposal: Compact Store Navigation

## Problem

The current Dashboard's Store Relationship Card displays both `pointerStore` (1:1, primary work destination) and `references` (1:many, up to 10+ items) in a single expanded card at the top of the Dashboard. This causes:

1. **Space pressure**: The card occupies significant vertical space, pushing Summary Cards and Active Changes below the fold
2. **Weak visual hierarchy**: The primary pointer store has equal visual weight as reference stores
3. **Mobile degradation**: The card dominates the viewport, requiring 3-4 scrolls to reach Active Changes
4. **Information overload**: Reference list items (label + storeId + path + action) consume ~40px each, totaling ~400px for 10 references

## Proposed Solution

Restructure the Store Relationship Card into a compact, two-part layout:

1. **Pointer Store**: Inline single-line display (similar to Validation status) with direct Open action
2. **References**: Collapsed by default with count badge; expandable to show full list

## Goals

- Maintain Dashboard top placement for store relationship visibility
- Reduce vertical space consumption by 70%+ for typical configurations
- Preserve quick access to both pointer store and reference stores
- Ensure mobile-friendly collapsed state (single line)

## Non-Goals

- Changing store discovery or resolution logic
- Modifying ProjectSelector behavior
- Altering storeHelpers API or data structures
- Adding new UI components beyond existing Collapsible pattern

## Success Metrics

- Store Relationship Card height reduced from ~400px to ~60px (collapsed state)
- Pointer store Open action remains 1-click accessible
- References accessible within 1 click (expand + click)
- No increase in Dashboard total scroll depth
