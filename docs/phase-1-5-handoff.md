# EZQuest Shopify Phase 1.5 Handoff

## 1. Revised Setup Checklist

### Local Setup

1. Install Node.js `>=20.10.0`.
2. Install Shopify CLI.
3. Clone the repository and run `npm install`.
4. Authenticate with Shopify CLI using `shopify auth login`.
5. Connect to the EZQuest development store with `shopify theme dev --store <store-url>`.
6. Run `npm run dev` for local CSS compilation plus Shopify dev.
7. Run `npm run check` before any push or PR.

### Baseline Workflow

1. Create a clean git baseline immediately after CLI auth, dependency install, and first successful local preview.
2. Use a dedicated unpublished theme for development and QA.
3. Treat `main` as production-safe; push active work through short-lived feature branches.
4. Use `npm run push:staging` to deploy to an unpublished theme for review.
5. Use `npm run package` only for release packaging or backup snapshots.

### Theme Quality Guardrails

- Keep JavaScript to confirmed interaction needs only.
- Keep templates thin and section-driven.
- Keep merchant-editable content in settings, blocks, metafields, or metaobjects as appropriate.
- Route all reusable UI strings through `locales/`.
- Use Theme Check continuously from day one.

## 2. Revised Folder Structure

```text
ezquest-theme/
├── .gitignore
├── .shopifyignore
├── .theme-check.yml
├── README.md
├── package.json
├── package-lock.json
├── postcss.config.cjs
├── tailwind.config.cjs
├── docs/
│   └── phase-1-5-handoff.md
├── src/
│   └── styles/
│       └── theme.css
├── assets/
│   ├── theme.css
│   ├── theme.js
│   └── component-accordion.js
├── config/
│   ├── settings_schema.json
│   └── settings_data.json
├── layout/
│   ├── theme.liquid
│   └── password.liquid
├── locales/
│   ├── en.default.json
│   └── en.default.schema.json
├── sections/
│   ├── header-group.json
│   ├── footer-group.json
│   ├── header.liquid
│   ├── footer.liquid
│   ├── announcement-bar.liquid
│   ├── hero-home.liquid
│   ├── hero-page.liquid
│   ├── main-page.liquid
│   ├── main-collection.liquid
│   ├── main-product.liquid
│   ├── main-blog.liquid
│   ├── main-article.liquid
│   ├── main-cart.liquid
│   ├── main-search.liquid
│   ├── collection-feature-grid.liquid
│   ├── product-story-carousel.liquid
│   ├── product-story-grid.liquid
│   ├── product-spec-table.liquid
│   ├── product-compare-table.liquid
│   ├── support-card-grid.liquid
│   ├── support-nav-grid.liquid
│   ├── support-resource-list.liquid
│   ├── faq-accordion.liquid
│   ├── troubleshooting-list.liquid
│   ├── article-feed.liquid
│   └── cta-banner.liquid
├── snippets/
│   ├── site-header.liquid
│   ├── mega-menu-panel.liquid
│   ├── mobile-nav-drawer.liquid
│   ├── site-footer.liquid
│   ├── breadcrumbs.liquid
│   ├── icon.liquid
│   ├── button.liquid
│   ├── badge.liquid
│   ├── card-product.liquid
│   ├── card-article.liquid
│   ├── card-support.liquid
│   ├── media.liquid
│   ├── price.liquid
│   ├── accordion-item.liquid
│   ├── spec-row.liquid
│   ├── compare-cell.liquid
│   └── support-search-form.liquid
└── templates/
    ├── 404.json
    ├── article.json
    ├── blog.json
    ├── cart.json
    ├── collection.json
    ├── index.json
    ├── product.json
    ├── search.json
    ├── page.about.json
    ├── page.compare.json
    ├── page.compatibility.json
    ├── page.contact.json
    ├── page.cookie-policy.json
    ├── page.downloads.json
    ├── page.faq.json
    ├── page.manuals.json
    ├── page.our-story.json
    ├── page.shipping-returns.json
    ├── page.support.json
    ├── page.troubleshooting.json
    ├── page.warranty.json
    └── page.where-to-buy.json
```

## 3. Sitemap Implementation Matrix

| Page Name | URL | Shopify Resource | Template | Type | Notes |
|---|---|---|---|---|---|
| Home | `/` | Home | `index.json` | JSON template | Merchandising sections remain section-driven |
| Shop All | `/collections/all` | Collection | `collection.json` | Collection | Collection merchandising can stay section/block-based initially |
| Hubs & Adapters | `/collections/hubs-adapters` | Collection | `collection.json` | Collection | Category narrative may later use collection metafields |
| Docking Stations | `/collections/docking-stations` | Collection | `collection.json` | Collection | Category narrative may later use collection metafields |
| Chargers & Power | `/collections/chargers-power` | Collection | `collection.json` | Collection | Category narrative may later use collection metafields |
| Cables | `/collections/cables` | Collection | `collection.json` | Collection | Category narrative may later use collection metafields |
| Accessories | `/collections/accessories` | Collection | `collection.json` | Collection | Category narrative may later use collection metafields |
| Product Detail | `/products/<handle>` | Product | `product.json` | Product | Specs, comparison, compatibility, downloads should move to metafields/metaobjects |
| Compare Products | `/pages/compare` | Page | `page.compare.json` | Custom page | Should later be powered by comparison metaobjects |
| Search | `/search` | Search | `search.json` | Search template | Keep native Shopify search |
| Cart | `/cart` | Cart | `cart.json` | Cart template | Native cart with lightweight enhancements only |
| Support Landing | `/pages/support` | Page | `page.support.json` | Custom page | Support entry links can begin as blocks, later metaobject-backed if needed |
| Downloads | `/pages/downloads` | Page | `page.downloads.json` | Custom page | Move downloadable assets into support-resource metaobjects |
| Manuals | `/pages/manuals` | Page | `page.manuals.json` | Custom page | Move manual library into support-resource metaobjects |
| Compatibility | `/pages/compatibility` | Page | `page.compatibility.json` | Custom page | Compatibility datasets should not remain static page content long term |
| FAQ | `/pages/faq` | Page | `page.faq.json` | Custom page | Shared FAQ content may later use metaobjects |
| Troubleshooting | `/pages/troubleshooting` | Page | `page.troubleshooting.json` | Custom page | Troubleshooting trees/resources may later use metaobjects |
| Warranty & Claims | `/pages/warranty` | Page | `page.warranty.json` | Custom page | Keep as page content unless claim flows become structured |
| Shipping & Returns | `/pages/shipping-returns` | Page | `page.shipping-returns.json` | Custom page | Chosen as custom page, not a Shopify policy page |
| Contact Support | `/pages/contact` | Page | `page.contact.json` | Custom page | Contact form/embed details can be added in Phase 2 |
| Blog Listing | `/blogs/ezquest-journal` | Blog | `blog.json` | Blog | Editorial structure stays native Shopify blog |
| Blog Article | `/blogs/ezquest-journal/<article>` | Article | `article.json` | Article | Related content can be section/block driven initially |
| About EZQuest | `/pages/about` | Page | `page.about.json` | Custom page | Narrative page, likely stays page content + sections |
| Our Story | `/pages/our-story` | Page | `page.our-story.json` | Custom page | Uses the same content architecture as About with its own template handle |
| Where To Buy | `/pages/where-to-buy` | Page | `page.where-to-buy.json` | Custom page | Keep simple unless dealer/location data becomes structured |
| Cookie Policy | `/pages/cookie-policy` | Page | `page.cookie-policy.json` | Custom page | Custom legal content page |
| Privacy Policy | `/policies/privacy-policy` | Shopify Policy | Shopify-managed | Policy page | Keep native Shopify policy |
| Terms of Service | `/policies/terms-of-service` | Shopify Policy | Shopify-managed | Policy page | Keep native Shopify policy |
| Refund Policy | `/policies/refund-policy` | Shopify Policy | Shopify-managed | Policy page | Keep native Shopify policy |

## 4. Content Model Checkpoint

### Keep As Normal Page Content

- About content
- Warranty policy guidance
- Shipping and returns editorial content
- Cookie policy content
- Contact page copy
- Long-form blog articles

### Keep In Section Settings

- Hero headings, eyebrow labels, short intros, CTA labels, CTA links
- Optional homepage merchandising modules
- Collection support CTA blocks
- Footer and header presentation controls
- Page-level presentation toggles that do not represent reusable business data

### Keep In Section Blocks

- Homepage story cards
- Support landing shortcut cards
- FAQ items during early content validation
- CTA card lists
- Temporary downloads/manual cards before the data model is finalized

### Move To Product Metafields

- Core product specification values that belong to a single product
- Product support summary text
- Key compatibility notes specific to one product
- Product-level download references if there are only a few per product

Recommended namespaces:

- `custom.spec_*`
- `custom.support_*`
- `custom.compatibility_*`

### Move To Metaobjects

- Manuals library
- Firmware and software downloads
- Driver downloads
- Compatibility datasets spanning multiple products/devices
- Product comparison datasets reused across pages
- Support resource entries used in multiple places
- Shared FAQ collections by product family or issue type

Recommended metaobject types:

- `support_resource`
- `manual_resource`
- `download_resource`
- `compatibility_entry`
- `comparison_group`
- `faq_entry`

### EZQuest-Specific Guidance

#### Product Specs

- Keep simple merchandising summaries in sections at first.
- Store durable spec rows in product metafields.
- If multiple products share spec schemas, define standard metafield definitions before content entry.

#### Comparison Data

- Do not hardcode long comparison tables in section settings.
- Use a `comparison_group` metaobject with referenced products and structured comparison rows.

#### Manuals And Downloads

- Do not leave these as static rich text lists.
- Use metaobjects for title, product family, version, file URL, platform, language, and status.

#### Firmware / Driver Resources

- Treat these as support resources, not generic page copy.
- Model release version, release date, supported devices, and file URL structurally.

#### Compatibility Information

- Use metaobjects if compatibility spans many products or host devices.
- Reserve page sections for explanation and filtering UI, not for storing the dataset itself.

#### FAQ / Troubleshooting

- Early Phase 2 can use section blocks while content is still changing.
- Move to metaobjects if support content becomes shared, searchable, or product-family specific.

## 5. Phase 2 Implementation Order

1. Global shell
   - Finalize `theme.liquid`, header/footer groups, theme settings, base CSS tokens, and utility snippets.
2. Homepage
   - Build hero, feature/story modules, editorial rail, and CTA structure.
3. Collection page
   - Build PLP layout, collection intro, merchandising support sections, and support CTA.
4. Product page
   - Build PDP layout first, then specs, comparisons, and support pathways.
5. Support landing
   - Build entry architecture for tasks, product families, and escalation paths.
6. Support resource pages
   - Build downloads, manuals, compatibility, warranty, and shipping/returns templates.
7. FAQ / troubleshooting
   - Build accordion and issue-list patterns, then connect to the chosen content model.
8. Blog / static pages
   - Build blog listing/article and finish About, Contact, and any remaining informational pages.

## 6. Naming Conventions

- Templates: `resource.purpose.json`
- Sections: `main-*` for resource owners, descriptive noun phrases for reusable modules
- Snippets: singular component or utility names
- Assets: `theme.*` for global files, `component-*` only when a script is truly reusable
- Setting IDs: `domain_purpose_name`
- Locale keys: `domain.group.label`
- Metafields: reserve `custom.*` until a namespace strategy is finalized
- Metaobjects: singular type names describing durable business entities

## 7. Risks / Assumptions / Open Questions

### Risks

- The current support resource pages are structurally ready, but the data model is not finalized yet.
- If comparison and compatibility data stay in section settings too long, Phase 2 implementation will incur rework.
- Search/discovery needs may expand once support content volume increases.

### Assumptions

- EZQuest will use Shopify pages/blogs for editorial and policy-adjacent content.
- Shopify policies remain native for privacy, terms, and refunds.
- Support resource data volume will justify structured content shortly after Phase 2 starts.

### Open Questions

- Which exact product families need dedicated compatibility dimensions first.
- Whether manuals/downloads should be segmented by product family, SKU, OS/platform, or all three.
- Whether FAQ content should be globally searchable in Phase 2 or only browsable.
