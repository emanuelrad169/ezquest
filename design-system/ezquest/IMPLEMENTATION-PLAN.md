# EZQuest — Design System Implementation Plan
> Generated from ui-ux-pro-max skill, reconciled to EZQuest's tech-premium reality.
> Pattern: **Hero-Centric + Social Proof** · Conversion: **Emotion-driven + trust** · Sector: **E-commerce (premium consumer electronics)**

---

## 0. Two judgment calls (skill output vs. EZQuest reality)

The skill is a tool, not gospel — two of its raw recommendations need adapting:

1. **Typography — KEEP Rubik / Nunito Sans (do NOT switch to Bodoni Moda).**
   The luxury query returned a serif (Bodoni) tuned for *fashion / luxury goods*. EZQuest sells USB‑C hardware to Mac/PC buyers — a serif reads "perfume ad," not "premium tech." The e‑commerce‑specific pairing (Rubik headings / Nunito body, already shipped) is the right premium‑tech voice. **Decision: keep current fonts.**

2. **Style — adopt the *restrained* subset of "Liquid Glass," reject the heavy parts.**
   The skill flagged Liquid Glass ⚠ Performance: Moderate‑Poor, ⚠ Accessibility: contrast. On a conversion-critical Shopify store that's a trap. **Take:** soft shadows, smooth 200–300ms transitions, gentle hover, *subtle* backdrop‑blur (header/drawers only). **Reject:** SVG morphing, chromatic aberration, iridescent gradients, 400–600ms animations.

---

## 1. Pattern — Hero-Centric + Social Proof (site-wide spine)
Every key page follows: **Hero → value/benefit → social proof → CTA.**
- Social proof *before* the primary CTA. 3–5 testimonials w/ photo + name + role.
- Trust elements near every CTA: free-shipping, 30-day returns, 1–2yr warranty, secure checkout, "As featured in" logos.
- One clear primary CTA per section (secondary = subordinate link). ✅ already enforced on hero + page-cta.

## 2. Color rules (emotion + trust, accessible)
- **Neutrals:** near-black `#0a0a0a/#1d1d1f`, white, cool grey `#f5f5f7`. Alternating dark→white→grey rhythm (existing).
- **Accent:** EZQuest amber `#FED300`. **Rule:** amber as background/badge/chip or black-text-on-amber CTA. **Never amber text on white** (fails 4.5:1).
- **Trust greens / star gold** only in reviews/badges. Destructive `#DC2626`.

## 3. Motion & Effects — the "wow factor" (global tokens)
Add/align these tokens in `src/styles/theme.css :root`, then use everywhere:
```css
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);  /* enter */
--ease-in:  cubic-bezier(0.4, 0, 1, 1);       /* exit  */
--dur-fast: 200ms;  --dur-base: 260ms;  --dur-slow: 320ms;  /* cap 320ms */
--shadow-rest:  0 1px 2px rgba(15,23,42,.05);
--shadow-hover: 0 8px 24px rgba(15,23,42,.09);
--shadow-lift:  0 18px 50px rgba(15,23,42,.12);
```
**Gentle hover (cards/tiles/products):** `transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)` · rest `--shadow-rest` → hover `translateY(-3px) + --shadow-hover`.
**Press:** `scale(0.97)` (cards) / `0.985` (buttons) — already shipped on home cards + buttons.
**Reveal-on-scroll:** keep existing IO system; stagger 30–50ms; **animate ≤2 key elements per view.**
**Subtle blur:** header overlay + drawers only (`backdrop-filter: blur(20px)`), not decorative.

## 4. UX guardrails (skill priorities)
- **High:** respect `prefers-reduced-motion` (disable transforms/animations); visible focus rings (never remove); don't rely on hover for primary actions; animate ≤1–2 elements/view; touch targets ≥44px.
- **Medium:** 150–300ms micro-interactions (cap 500ms); hover = cursor + subtle visual change; loaders are the only continuous animation.
- **Low:** ease-out entering / ease-in exiting (no linear).
- **Always:** 4.5:1 text contrast, SVG icons (no emoji), responsive 375/768/1024/1440, no horizontal scroll, single gutter (no doubled padding).

---

## 5. Per-page rollout (phased)

**Phase A — Global foundation (do once, benefits all pages)**
- Add the motion/shadow tokens (§3) to `:root`.
- Codify a reusable `.u-hover-lift` + `.u-press` utility + a global `prefers-reduced-motion` reset.
- Audit & remove any remaining doubled-gutter (recurring bug: `.decision-guide`, `.free-shipping-strip` fixed; sweep the rest).

**Phase B — Homepage** (the hero-centric + social-proof showcase)
- Hero: ✅ done (overlay header, centered dots, single primary). Add gentle parallax-free reveal polish.
- Collections strip / bento / featured / confidence: apply hover-lift + soft-shadow tokens (press-feedback ✅ done).
- Testimonials: ensure photo+name+role, 3–5, social proof *before* a closing CTA.
- Press/"As featured in": trust band.

**Phase C — PDP** (highest revenue)
- Hero gallery + sticky ATC (exists) → add soft-shadow buy-box, gentle image hover-zoom (≤300ms), trust row under ATC, reviews block w/ star gold, FBT/recently-viewed with hover-lift.

**Phase D — Collection / Search**
- Product cards: unified hover-lift + soft shadow + press (✅ tokens), quick-add gentle reveal, faceted filters, no orphaned last card.

**Phase E — Support & Discovery cluster** (compatibility, troubleshooting, faq, downloads, manuals, firmware, user-guides, warranty, contact, compare, help-me-choose, where-to-buy)
- Apply page-hero overlay + Rubik, single-gutter, reveal-class correctness (✅ help-me-choose fixed), icon-led cards, page-cta single-primary (✅), soft-shadow cards + gentle hover.

**Phase F — Brand / Resources / Policy** (about, our-story, blog, article, shipping-returns ✅, cookie/refund policy)
- Editorial spacing, readable measure (60–75ch), reveal polish, trust CTA.

---

## 6. Done so far (baseline already at standard)
Sticky nav · overlay header · fonts (Rubik/Nunito) · card press-feedback · hero single-CTA · help-me-choose reveal + spacing · page-cta hierarchy · shipping-returns hero spec-block + badge chip · apostrophe/Liquid content fixes.

## 7. Anti-patterns to avoid (skill)
Vibrant/block-based playful colors · emoji icons · animating everything · >500ms UI animation · hover-only actions · removing focus outlines · doubled gutters · amber text on white · raw hex in components (use tokens).
