# Phase 2 — Deleted Files

Run date: 2026-04-15

## Files Deleted (5 total)

| File | Type | Reason |
|------|------|--------|
| snippets/badge.liquid | Snippet | Zero render references in any theme file |
| snippets/card-article.liquid | Snippet | Zero render references in any theme file |
| snippets/card-support.liquid | Snippet | Zero render references in any theme file |
| sections/collection-feature-grid.liquid | Section | Not referenced in any JSON template or section group |
| sections/support-card-grid.liquid | Section | Not referenced in any JSON template or section group |

## Verification

- Triple-confirmed with grep: `grep -r "render 'FILENAME'"` across all .liquid and .json files
- `.claude/settings.local.json` hits excluded (tool permissions, not theme usage)
- `shopify theme check` run after deletion: **111 files, 0 offenses**
