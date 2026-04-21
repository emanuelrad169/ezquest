# EZQuest Non-Product Storefront Image Inventory

This inventory covers missing non-product images for the premium EZQuest storefront image system. Product packshots remain under `public/ezq-products/` and are intentionally excluded.

## Missing Image Set

- Homepage hero slides: 4 concepts, each with desktop and mobile crops.
- Collection images: Hubs & Adapters, Docking Stations, Chargers & Power, Cables & Accessories.
- Homepage category cards: the same four storefront categories, simplified for compact cards.
- Lifestyle/context images: clean desk setup, travel setup, charging scene.
- Support/education images: how it works, compatibility scenes, multi-device charging setup.

## Output Folders

- `public/images/homepage/`
- `public/images/collections/`
- `public/images/category-cards/`
- `public/images/lifestyle/`
- `public/images/support/`

## Generation Manifest

Use `prompts/shopify-images.json` as the complete batch manifest. Each generated image saves a `.prompt.md` and `.prompt.json` sidecar next to the PNG.
