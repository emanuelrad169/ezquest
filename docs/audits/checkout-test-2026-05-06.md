# Checkout Test — 2026-05-06

**Status:** Pending — requires a real card and 10 minutes at the keyboard.

---

## Pre-conditions

- [ ] Store password is off (confirmed: `password_enabled: false`)
- [ ] Use lowest-cost product to minimize transaction cost
- [ ] Have a real card ready (will be refunded immediately after step 9)
- [ ] Have access to an email inbox to verify confirmation email

---

## Steps

| # | Action | Expected result | Pass / Fail |
|---|--------|----------------|-------------|
| 1 | Navigate to any product page | Page loads correctly | |
| 2 | Select a variant (if applicable), click Add to Cart | Cart drawer opens, item appears with correct name, price, quantity | |
| 3 | Open cart → click Checkout | Redirects to Shopify checkout at checkout.shopify.com | |
| 4 | Fill shipping address (real but disposable OK) | Address autocomplete works; no form errors | |
| 5 | Continue to shipping | Shipping rates appear; matches rates on /pages/shipping-returns | |
| 6 | Select a shipping method → Continue to payment | Subtotal, shipping, total are correct | |
| 7 | Enter real payment card | Card fields accept input without errors | |
| 8 | Click Place Order | Redirects to order confirmation page; order number shown | |
| 9 | Check email inbox | Order confirmation email arrives within 60 seconds | |
| 10 | Open Shopify Admin → Orders → find the order | Order shows correct line items, price, address | |
| 11 | Issue refund from Admin → Refund | Refund processes; refund email arrives | |
| 12 | Verify inventory | Inventory decremented on order, re-incremented after refund | |

---

## Pass criteria

All 12 steps pass. No launch gate is cleared until this is confirmed.

---

## Known risks to check

- Shipping rate accuracy: compare the checkout-displayed rate against the rates table on /pages/shipping-returns
- Tax calculation: confirm tax is applied correctly for California (EZQuest origin)
- Email: confirm from-address is branded (not noreply@shopify.com)
- Refund email: confirm it arrives and has correct amount

---

## If any step fails

| Step | Likely cause | Resolution |
|------|-------------|------------|
| 3 — checkout redirect broken | Cart attribute or theme JS error | Check browser console; look for JS errors on ATC event |
| 5 — no shipping rates | Shopify Shipping not configured for zone | Admin → Settings → Shipping → Add rate for zone |
| 8 — payment declined | Test card used instead of real card | Use real card |
| 9 — no confirmation email | Shopify notifications disabled | Admin → Settings → Notifications → Order Confirmed |
| 11 — refund fails | Order not fulfilled yet | Refund is available even on unfulfilled orders; check Admin UI |

---

## Tester sign-off

**Tester:**  
**Date:**  
**Order #:**  
**Outcome:** Pass / Fail  
**Notes:**
