# EZQuest Phase 1 User Flows

This document formalizes the Phase 1 user-flow mapping using the implemented theme architecture as the source of truth.

## Flow principles

- browsing should quickly narrow into the right product family
- compare should help customers decide before they hesitate
- support should function as both pre-purchase confidence and post-purchase ownership help
- brand and editorial pages should route back into commerce or support without dead ends

## Primary navigation flow

### Global top-level movement

1. Homepage
2. One of:
   - Product family
   - Compare
   - Support
   - Resources
   - About
3. Destination page
4. Product page, support page, or contact path

## Commerce flows

### Standard commerce flow

1. Homepage
2. Product family / collection
3. Product detail page
4. Cart
5. Checkout

### Product-family-first flow

1. Homepage
2. Hubs & Adapters, Docking Stations, Chargers & Power, or Cables & Accessories
3. Collection page
4. Product detail page
5. Cart
6. Checkout

### Compare-assisted flow

1. Homepage, collection, or product page
2. Compare page
3. Product detail page
4. Cart
5. Checkout

### Support-assisted buying flow

1. Homepage, collection, compare page, or product page
2. Compatibility or FAQ
3. Product detail page
4. Cart
5. Checkout

## Product page decision flow

1. Gallery and buy box
2. Technical sheet
3. Compare nearby options
4. Compatibility
5. FAQ
6. Add to cart or move into support

## Support center flows

### Support hub flow

1. Support center
2. Choose one path:
   - Downloads
   - Manuals
   - Compatibility
   - FAQ
   - Troubleshooting
   - Contact support
3. Resolve with self-service or escalate to contact

### Downloads flow

1. Support center or product page
2. Downloads
3. Choose the right firmware, driver, or utility
4. If unresolved:
   - Manuals
   - Compatibility
   - Contact support

### Manuals flow

1. Support center or product page
2. Manuals
3. Open quick-start or full guide
4. If unresolved:
   - Troubleshooting
   - Contact support

### Compatibility flow

1. Product page or support center
2. Compatibility
3. Review platform, device, and workflow fit
4. Next step:
   - Product page
   - Manuals
   - Downloads
   - Contact support

### FAQ flow

1. Support center or product page
2. FAQ
3. Resolve common question
4. If unresolved:
   - Troubleshooting
   - Manuals
   - Contact support

### Troubleshooting flow

1. Support center
2. Troubleshooting
3. Follow symptom-led path
4. If unresolved:
   - Downloads
   - Compatibility
   - Contact support

## Editorial and discovery flows

### Blog discovery flow

1. Homepage or resources/blog index
2. Article page
3. Move into:
   - Product page
   - Support center
   - Collections

### About and story flow

1. About or Our Story
2. Learn the brand context
3. Move into:
   - Product families
   - Support center
   - Where to Buy

### Where-to-buy flow

1. Where to Buy
2. Choose direct or channel path
3. If still unsure:
   - Product families
   - Support
   - Contact

## Footer and safety-net flows

The footer functions as a recovery path for:

- support discovery
- company/about discovery
- legal review
- shipping and returns

## Support center information architecture map

### Fast-path support hub

- Downloads
- Manuals
- Compatibility
- Warranty
- Contact

### Clarification layer

- FAQ
- Troubleshooting

### Escalation layer

- Contact support
- Warranty

## Flow dependencies already represented in theme structure

- compare links exist in homepage, header, and product contexts
- support links exist in header, mega menu, homepage, product pages, and support pages
- manuals/downloads/compatibility/FAQ are cross-linked to prevent dead ends
- CTA banners on support, editorial, and static pages route back into commerce or help
