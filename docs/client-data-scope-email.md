# Client Email: Data Scope Confirmation

**Status:** DRAFT — send before DNS records updated at registrar  
**Blocks cutover:** Items 1, 2, 5, 7 (per recommendation in email)  
**Date drafted:** 2026-05-06

---

Subject: ezq.com migration — data scope confirmation needed before cutover

Hi [client],

Pre-flight is clean and we're DNS-ready. Before flipping the switch,
I need explicit confirmation on what data should migrate from the legacy
ezq.com platform to Shopify. The catalog and URL redirects are done.
The following items are NOT yet addressed and each needs a decision:

1. Customer accounts — do existing ezq.com customers need to be able to
   log in on the new site with their existing credentials and see their
   order history?

2. Historical orders — should past orders be importable into Shopify for
   support and warranty lookup?

3. Email subscriber list — what email platform are we keeping (Klaviyo,
   Mailchimp, etc.) and where does the list need to land?

4. Product reviews — does ezq.com have existing reviews that should
   migrate to Judge.me on Shopify?

5. Reseller / wholesale accounts — are there B2B customers with
   negotiated pricing or net terms?

6. Tax exemption certificates on file?

7. Outstanding gift card balances?

8. Open support tickets — anyone mid-conversation on the legacy system?

9. Inventory sync — are current Shopify stock levels accurate to the
   warehouse, or do they need a fresh export from the legacy system
   before cutover?

For each: "migrate" or "fresh start." A "fresh start" is fine but I
need it documented because each one has a customer-facing consequence
(account re-registration, lost order history, etc.).

If we cut over without addressing these, returning customers will hit
the new site unable to access their accounts, and their first
interaction with the new EZQuest will be a support email asking why
they "lost" their account.

Recommend we don't flip DNS until I have answers on at least items
1, 2, 5, 7. The rest can be addressed post-cutover if needed.

---

## Decision log (fill in as client responds)

| # | Item | Decision | Notes |
|---|------|----------|-------|
| 1 | Customer accounts | | |
| 2 | Historical orders | | |
| 3 | Email subscriber list | | |
| 4 | Product reviews | | |
| 5 | Reseller / wholesale | | |
| 6 | Tax exemptions | | |
| 7 | Gift card balances | | |
| 8 | Open support tickets | | |
| 9 | Inventory sync | | |

## Consequences by "fresh start" decision

| # | If "fresh start" | Mitigation |
|---|-----------------|------------|
| 1 | Customers can't log in, no order history | Add banner: "New site — re-register to access your account" |
| 2 | Support can't look up warranty by order | Keep legacy admin read-only for 90 days |
| 5 | B2B customers lose pricing → pay retail | Email wholesale list before cutover with new account setup link |
| 7 | Gift card holders lose balances | Shopify can't import legacy gift cards — must honor manually or reissue |
