# Phase 3 Payment Hold Notice
Date: 2026-04-15
Re: EZQuest Shopify Theme — 5-Phase Professional Package ($14,875)
Phase 3 trigger: "Fully functional Support Center — all pages navigable and testable."
Phase 3 payment: $2,975

---

We are holding Phase 3 payment pending resolution of the items below.
This is not a dispute. The milestone payment structure exists to verify
deliverables before funds are released. We are using it as designed.

The independent codebase audit completed on 2026-04-15 identified four
unresolved items that prevent Phase 3 from meeting its own contract trigger.
We have documented every finding with file-level evidence.

---

## Item 1 — Four download pages are empty and non-functional

**Affected pages:** `/pages/downloads`, `/pages/manuals`, `/pages/firmware`,
`/pages/user-guides`

**What the contract requires:** A functional Support Center where all pages
are navigable and testable. Download pages are listed as Phase 3 deliverables
in the project scope.

**What exists in the codebase:**

Each of these four pages has a template file and references the
`download-center` section. The section architecture and filter logic exist.
However, zero file entries are configured in any of the four templates.
A user visiting any of these pages today sees a filter pill bar above
an empty list.

Verified in:
- `templates/page.downloads.json` — section type `download-center`, zero file blocks
- `templates/page.manuals.json` — section type `download-center`, zero file blocks
- `templates/page.firmware.json` — section type `download-center`, zero file blocks
- `templates/page.user-guides.json` — section type `download-center`, zero file blocks

Additionally, the project's own architecture document (`docs/support-cms-architecture.md`)
defines these pages as metaobject-driven, sourcing content from
`ezquest_download`, `ezquest_manual`, `ezquest_firmware`, and `ezquest_user_guide`
metaobject types, rendered by `sections/support-resource-list.liquid`.
The current templates use a different section (`download-center`) with no
metaobject connection and no manually entered fallback data. Neither approach
has been populated.

**What we need before payment:**

One of the following, in writing:

Option A — Populate the four download pages with real EZQuest file entries
so that a user can browse, filter, and download files from each page.
File entries must include: file name, product family, file size, and a
working download link.

Option B — Provide a written technical explanation of why the pages are
intentionally empty at this stage, which Shopify store the metaobjects will
be seeded into, and a confirmed date by which the `shopify:seed:*` scripts
will be run against the live store to populate real download data.

---

## Item 2 — /pages/ticket-submission has no submission form

**Affected page:** `/pages/ticket-submission`

**What the contract requires:** This page was listed as a Phase 3 deliverable
under "Support Center Platform."

**What exists in the codebase:**

The template (`templates/page.ticket-submission.json`) contains three sections:
a page hero, the support nav rail, and a CTA rail. The hero copy reads:
"Ticket submission has been merged into the main support request flow."
The CTAs redirect the user to `/pages/contact`. There is no form, no input
fields, and no submission mechanism on this page.

`/pages/contact` does have a working contact form (`sections/contact-form-panel.liquid`).
If ticket submission was intentionally consolidated into the contact page by
mutual agreement, we have no record of that agreement.

**What we need before payment:**

One of the following, in writing:

Option A — Add a functional ticket submission form to `/pages/ticket-submission`
that captures the necessary support request fields and routes to the correct
endpoint.

Option B — Written confirmation, signed or email-confirmed, stating that
ticket submission was consolidated into `/pages/contact` by mutual agreement
at a specific point in the project, and that this consolidation satisfies
the contracted deliverable. We will accept this if the agreement can be
documented.

---

## Item 3 — Phase 4 status update required before Phase 3 payment

**Context:** The Phase 4 audit shows five of nine contracted deliverables
are not present anywhere in the codebase. We are raising this now because
the contract structure assumes phase work runs in parallel, and we need
written assurance that Phase 4 is actively in progress before we can be
confident that releasing Phase 3 funds will lead to full project delivery.

**What is missing from Phase 4 (verified by codebase search, 2026-04-15):**

| Deliverable | Codebase status |
|---|---|
| Wishlist | No implementation found in any file |
| Bundles / Frequently Bought Together | No implementation found in any file |
| Preorder & Back-in-Stock notifications | No implementation found in any file |
| Live chat integration | No widget, script tag, or app block found anywhere |
| Shoppable video | No section, embed, or integration found anywhere |

Searches covered all files in `sections/`, `snippets/`, `assets/`, `layout/`,
`templates/`, and `config/`. None of these five features have any code
representation — not a stub, not a placeholder, not a script tag.

**What we need before Phase 3 payment:**

A written Phase 4 delivery schedule specifying:

1. Which app or implementation approach will be used for each of the five
   missing items (wishlist, bundles/FBT, preorder/back-in-stock, live chat,
   shoppable video).
2. A target completion date for each item.
3. Whether any of these items require a specific Shopify app subscription
   that we need to activate on our end, and if so, which apps and what
   the recurring cost will be.

We are not withholding Phase 3 payment over Phase 4 progress. We are
asking for a written delivery plan so we can confirm Phase 4 is on track
before we release Phase 3 funds. This is standard practice for phased
contracts.

---

## Item 4 — Production store confirmation

**Current state:** The codebase is in a local development environment
(`/Applications/MAMP/htdocs/`). The theme has not been pushed to a
live Shopify store. `shopify theme push` has not been run.

The Phase 3 contract trigger is "fully functional Support Center — all
pages navigable and testable." Pages cannot be navigated or tested by
us on a URL we can access until the theme is pushed to a store.

**What we need before payment:**

1. The URL of the Shopify store where the theme will be deployed.
2. A target date for `shopify theme push` to an unpublished theme on
   that store, so we can review the pages in a real browser on a real
   Shopify environment.

This does not need to be the production/published theme — an unpublished
preview theme is sufficient for Phase 3 review.

---

## Summary of payment conditions

| # | Condition | Resolution required |
|---|-----------|---------------------|
| 1 | Download pages are empty | Populate with real files OR written seeding plan with date |
| 2 | Ticket submission has no form | Add form OR written confirmation of mutual consolidation |
| 3 | Phase 4 five missing deliverables | Written delivery schedule with approach + dates per item |
| 4 | Theme not on any live store | Store URL + date for `shopify theme push` to preview theme |

All four conditions must be resolved before we release Phase 3 payment.

Once they are resolved, we will re-run the codebase audit on the updated
files, and if all four items pass, payment will be released within 48 hours
of confirmation.

---

## What Phase 3 has delivered (for the record)

We want to be clear that the Phase 3 audit found substantial work done.
The following are verified as complete in the codebase:

- `/pages/support` — 4 structured sections, support nav rail, card grid ✓
- `/pages/faq` — faq-accordion with schema-editable blocks ✓
- `/pages/compatibility` — 697-line structured section reading from metaobjects ✓
- `/pages/troubleshooting` — troubleshooting-list with structured cards ✓
- `/pages/warranty` — info-card grid + rich page content ✓
- `/pages/contact` — full contact form with Shopify form tag ✓
- `/pages/help-me-choose` — 182-line decision guide reading from metaobjects ✓
- `sections/support-nav-rail.liquid` — sticky pill nav, active-state detection ✓

Eight of twelve Phase 3 deliverables are complete. We are not disputing
that work. We are asking for the four incomplete items to be finished
before the milestone payment is triggered.

---

Please respond to this notice with either the completed code changes or
the written confirmations requested above. Once received, we will
review and move to release payment promptly.

Questions or clarifications: creationartsdotus@gmail.com
