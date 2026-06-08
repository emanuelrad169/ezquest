---
name: shopify-image-system
description: Use when creating, editing, prompting, naming, batching, organizing, or QAing generated storefront images for the EZQuest Shopify theme. Applies to homepage heroes, mobile crops, collection banners, category promo cards, PDP support images, feature images, campaign visuals, and seasonal promo assets.
---

# Shopify Image System

Use this skill for EZQuest storefront image work.

## Required Context

1. Read `brand/image-style.md` before writing prompts or generating images.
2. Start from the relevant file in `prompts/templates/`.
3. Check existing `public/images/` outputs and `.prompt.md` sidecars for the previously approved visual style.
4. Use `scripts/generate-shopify-images.ts` for the complete non-product Shopify storefront image batch.
5. Use `scripts/generate-images.ts` only for generic or ad hoc image batches.

## Core Rules

- Premium modern consumer-tech ecommerce image language.
- Apple Store + Xiaomi + Anker-inspired minimal realism: airy store-like whitespace with clear accessory-category storytelling.
- White or very light gray wall backgrounds.
- Light wood desk only when lifestyle context is useful.
- Soft natural lighting or soft studio-natural hybrid lighting.
- No text inside images.
- No clutter, random props, or plants unless explicitly requested.
- Do not generate product packshots when the task is for storefront marketing, layout, contextual, support, or education imagery.
- Strong whitespace for overlay copy.
- Always establish one hero object and only secondary supporting objects.
- New assets must look consistent with previously generated EZQuest visuals, not like a new campaign from scratch.
- Avoid dark dramatic backgrounds and catalog-style equal-weight layouts.
- Avoid inventing ports, connectors, screens, or device details when product accuracy matters.

## Asset Logic

- Homepage hero desktop: whitespace on the left, product story on the right, 2-4 objects.
- Homepage hero mobile: whitespace on top, product story lower in frame, 1-3 objects.
- Collection image: centered and recognizable, one hero object plus 1-2 supporting objects, calm and uncluttered.
- Category promo card: bold simple focal point, 1-2 objects, fast read at small sizes.
- PDP support image: tighter crop, 1-3 objects, feature or usage clarity first.
- Campaign asset: seasonal or promotional mood without clutter or text embedded in the image.

## Workflow

1. Identify asset type, category, purpose, canvas, environment, hero product, supporting products, and needed variants.
2. Select existing approved image or prompt sidecars as style references when available.
3. Select the closest template from `prompts/templates/`.
4. Preserve the shared brand rules and adapt only composition, object count, and feature focus.
5. Save outputs under `public/images/` in the matching asset folder.
6. Save the prompt source next to each image as `.prompt.md` and metadata as `.prompt.json`.
7. Before referencing images in Liquid, confirm the generated crop leaves the intended text-safe area clear.

## Batch Generation

Use:

```sh
node scripts/generate-shopify-images.ts --manifest prompts/shopify-images.json --dry-run
```

Dry-run writes prompt sidecars without calling an image provider. Use `--generate` only when the environment has `OPENAI_API_KEY` or `IMAGE_API_KEY` configured.
