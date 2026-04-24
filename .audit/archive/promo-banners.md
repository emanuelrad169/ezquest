## Promo Banner Images — Complete
Date: 2026-04-21

### Audit Result
The collection grid promo tiles are hardcoded in `sections/main-collection.liquid` and rendered by `snippets/collection-promo-tile.liquid`. No promo/banner schema blocks with empty image settings were found in collection templates.

### Active Promo Tiles
| Banner | CDN URL | Wired to | Live status |
|--------|---------|----------|-------------|
| Ready for a full desk? | https://cdn.shopify.com/s/files/1/0735/0265/4662/files/ezquest-promo-ready-for-desk.jpg?v=1776771590 | `templates/collection.json` → `main.promo_ready_for_desk_image` | PASS: `/collections/hubs-adapters` |
| Power, refined | https://cdn.shopify.com/s/files/1/0735/0265/4662/files/ezquest-promo-power-up.jpg?v=1776771587 | `templates/collection.json` → `main.promo_power_up_image` | PASS: `/collections/docking-stations` |
| Finish the setup | https://cdn.shopify.com/s/files/1/0735/0265/4662/files/ezquest-promo-duraguard-cables.jpg?v=1776771584 | `templates/collection.json` → `main.promo_duraguard_cables_image` | PASS: `/collections/chargers-power` |
| Expand the setup | https://cdn.shopify.com/s/files/1/0735/0265/4662/files/ezquest-promo-travel-kit.jpg?v=1776771593 | `templates/collection.json` → `main.promo_travel_kit_image` | PASS: `/collections/accessories` |

### Generated Files
| File | Dimensions | Status |
|------|------------|--------|
| `public/images/promo-banners/promo-ready-for-desk.jpg` | 1200 × 628 | Generated, uploaded, wired |
| `public/images/promo-banners/promo-power-up.jpg` | 1200 × 628 | Generated, uploaded, wired |
| `public/images/promo-banners/promo-duraguard-cables.jpg` | 1200 × 628 | Generated, uploaded, wired |
| `public/images/promo-banners/promo-travel-kit.jpg` | 1200 × 628 | Generated, uploaded, wired |
| `public/images/promo-banners/promo-compatibility.prompt.md` | prompt sidecar only | Not generated: OpenAI billing hard limit reached |
| `public/images/promo-banners/promo-gan-chargers.prompt.md` | prompt sidecar only | Not generated: OpenAI billing hard limit reached |

### Verification
| Page | Promo tile markup | Expected image | Status |
|------|-------------------|----------------|--------|
| `/collections/hubs-adapters` | Yes | `ezquest-promo-ready-for-desk` | PASS |
| `/collections/docking-stations` | Yes | `ezquest-promo-power-up` | PASS |
| `/collections/chargers-power` | Yes | `ezquest-promo-duraguard-cables` | PASS |
| `/collections/accessories` | Yes | `ezquest-promo-travel-kit` | PASS |

### Validation
- `npm run check`: 0 offenses
- Shopify push: development theme `149896921286` updated successfully

### Fix: Pushed to correct live theme
Theme: `150294855878` (`EZQuest v1.0 — 2026-04-15`, live)
Previous push was to: `149896921286` (`Development (e18d50-Emanuels-Mac-Studio)`, dev)

Verified on live site:
- `/collections/hubs-adapters` → promo image: PASS
- `/collections/docking-stations` → promo image: PASS
- `/collections/chargers-power` → promo image: PASS
- `/collections/accessories` → promo image: PASS

Live push validation:
- `npm run check`: 0 offenses
- `shopify theme push --theme=150294855878 --allow-live`: successful

Total active promo tiles: 4/4 generated, uploaded, wired, and verified.
Reserve concepts pending generation after OpenAI billing limit is increased: 2.
