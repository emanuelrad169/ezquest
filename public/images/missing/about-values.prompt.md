# EZQuest Missing Storefront Image Prompt

Asset type:
About values

Purpose:
About values image showing product usefulness in a calm home office.

Canvas:
1440 x 680 px final Shopify-ready image (36:17). Generate at 1536x1024, then crop and resize to the final target.

Composition:
Wide editorial image with an EZQuest-style hub as hero beside a MacBook Pro, with ample whitespace.

Environment:
Clean home office setup with warm California light and a soft bokeh background.

Primary request:
EZQuest USB-C hub with MacBook Pro in a clean home office setup. Bokeh background, lifestyle photography, warm California light. No text.

Style:
Premium modern consumer-tech ecommerce image. Apple Store + Xiaomi + Anker-inspired minimal realism. Soft natural lighting unless the asset specifically requests controlled moody studio lighting. Premium realistic materials, clean shadows, subtle depth, and a clear hero object hierarchy. No text in image. No clutter. No unnecessary props. Not a product packshot.

Product hierarchy:
Hero object: EZQuest-style USB-C hub.
Supporting objects:
- MacBook Pro as context only.

Reference image guidance:
No specific product-reference file supplied. Preserve plausible EZQuest hardware forms and avoid inventing functional details.

Style continuity:
Match the approved EZQuest generated storefront style: light gray/white background, soft natural shadows, calm premium consumer-tech materials, consistent camera height, generous whitespace, and one clear hero object with restrained support.

Brand rules inherited:
# EZQuest Image Style

This is the source of truth for generated storefront visuals across the EZQuest Shopify theme.

## Brand Language

EZQuest images should feel like premium modern consumer-tech ecommerce: calm, clean, useful, and materially realistic. The visual reference point is Apple Store restraint blended with Xiaomi simplicity and Anker accessory-category clarity: minimal environments, confident product hierarchy, clear charger/hub/cable family storytelling, and generous whitespace for Shopify overlay copy.

## Global Rules

- No text rendered inside generated images.
- No busy compositions or catalog-style equal-weight product spreads.
- No product packshots for marketing, layout, contextual, support, or education image requests.
- No random props, clutter, plants, keyboards, cups, books, cables in messy piles, or decorative lifestyle filler unless explicitly requested.
- No monitors unless the asset brief explicitly asks for a desk, compatibility, or display-support scene.
- Use white or very light gray wall backgrounds.
- Use a light wood desk only when lifestyle context helps explain use.
- Use soft natural daylight or a soft studio-natural hybrid light.
- Keep shadows subtle, realistic, and grounded.
- Materials should look premium and real: satin aluminum, clean polymer, braided cable texture, precise port geometry, soft highlights.
- Establish one hero product first, then supporting objects only when they clarify the story.
- Preserve large clean whitespace for text overlays.
- Avoid dark dramatic backgrounds unless a request explicitly overrides the system.
- Avoid generic CGI, fake reflections, exaggerated glow, and impossible scale.
- Keep product families readable in the Anker accessory-category sense: a charger image should clearly read as chargers, a hub image as connectivity, and a cable image as cable quality.
- Reuse the previously approved generated style. New images should look like they belong to the same EZQuest storefront campaign family, with consistent lighting, background color, material rendering, camera height, shadow softness, and whitespace logic.

## Composition Rules

### Homepage Hero Desktop

- Purpose: emotional brand perception and premium first impression.
- Layout: text-safe whitespace on the left, product story on the right.
- Object count: 2-4.
- Environment: minimal white or light gray wall, optional light wood desk.
- Product hierarchy: one dominant hero object, one to three supporting objects.

### Homepage Hero Mobile

- Purpose: premium first impression on narrow screens.
- Layout: text-safe whitespace on top, product story lower in frame.
- Object count: 1-3.
- Environment: minimal wall or simple desk edge.
- Product hierarchy: one clear hero object with restrained support.

### Collection Image

- Purpose: category clarity and recognizability.
- Layout: centered and balanced, cleaner than a hero but still premium.
- Object count: one hero object plus 1-2 supporting objects maximum unless the brief explicitly asks for a wider category range.
- Environment: controlled minimal surface or clean wall.
- Product hierarchy: category hero object leads, supporting products clarify range.

### PDP Support Image

- Purpose: explain a feature, usage moment, scale, or compatibility.
- Layout: closer crop with a clear focal point.
- Object count: 1-3.
- Environment: simple realistic context only.
- Product hierarchy: product feature leads; support objects should explain use, not decorate.

### Promo Tile

- Purpose: fast visual communication in a compact card.
- Layout: bold simple focal point with enough breathing room for overlay copy.
- Object count: 1-2.
- Environment: minimal wall, surface, or no visible environment.
- Product hierarchy: one product or product pair reads instantly.

### Campaign Or Seasonal Promo

- Purpose: promotional energy while preserving the premium brand.
- Layout: simple hero object, strong whitespace, seasonal cue only if requested.
- Object count: 1-3.
- Environment: minimal and bright.
- Product hierarchy: campaign product or offer category leads; seasonal cues stay secondary.

## Category Notes

- Hubs & Adapters: emphasize port clarity, slim aluminum forms, laptop-adjacent usefulness without showing full workstation clutter.
- Docking Stations: emphasize desk confidence, cable organization, and multi-device capability without showing monitors unless explicitly requested.
- Chargers & Power: emphasize compact scale, clean wall outlet or desk context, premium polymer, and calm power readiness.
- Cables & Accessories: emphasize connector quality, braided or durable material texture, gentle curves, and uncluttered negative space.

## Style Continuity Workflow

- Before prompting a new asset, inspect approved images and `.prompt.md` files under `public/images/`.
- Reuse the closest existing asset class as a style reference: homepage hero to homepage hero, collection to collection, PDP support to PDP support.
- Keep camera angle, lighting softness, background brightness, surface treatment, and product spacing consistent unless the request explicitly changes them.
- Add previous image paths or prompt paths to the manifest `styleReferences` field when batching.

## Negative Prompt Baseline

No text, no logo-like fake marks, no product packshot, no plant, no keyboard, no monitor unless explicitly requested, no dark background, no busy composition, no clutter, no random props, no messy cables, no generic CGI feel, no exaggerated reflections, no neon lighting, no hands unless explicitly requested, no impossible ports, no distorted connectors.

Negative constraints:
- No text in image.
- No fake logo marks.
- No product packshot.
- No plant.
- No keyboard.
- No monitor unless this asset explicitly requests a desk, compatibility, or display-support scene.
- No dark background.
- No busy composition.
- No clutter.
- No random props.
- No messy cables.
- No generic CGI feel.
- No exaggerated reflections.
- No neon lighting.
- No hands unless explicitly requested.
- No impossible ports.
- No distorted connectors.
