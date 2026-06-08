#!/usr/bin/env bash
# Usage: bash scripts/migration/06-monitor-cutover.sh
# Polls DNS resolution, HTTP status, and canonical tag every 5 minutes.
# Run from the moment DNS records are updated at the registrar.
# Press Ctrl+C to stop.

DOMAIN="ezq.com"
SHOPIFY_IP="23.227.38.65"
LOG="docs/cutover-log-$(date +%Y%m%d).txt"

echo "Monitoring DNS cutover for ${DOMAIN}"
echo "Target IP: ${SHOPIFY_IP}"
echo "Log: ${LOG}"
echo "Press Ctrl+C to stop."
echo ""

mkdir -p docs

while true; do
  TS=$(date +%H:%M:%S)

  RESOLVED=$(dig +short "${DOMAIN}" @8.8.8.8 | head -1 2>/dev/null || echo "ERR")
  IP_STATUS=$( [ "$RESOLVED" = "$SHOPIFY_IP" ] && echo "✅ Shopify" || echo "⏳ ${RESOLVED:-unknown}" )

  HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}" 2>/dev/null || echo "ERR")
  SSL=$(curl -s -o /dev/null -w "%{ssl_verify_result}" --max-time 10 "https://${DOMAIN}" 2>/dev/null || echo "ERR")
  SSL_STATUS=$( [ "$SSL" = "0" ] && echo "SSL:OK" || echo "SSL:${SSL}" )

  CANONICAL=$(curl -s --max-time 10 "https://${DOMAIN}" 2>/dev/null \
    | grep -oE 'rel="canonical" href="[^"]+"' \
    | head -1 \
    | grep -oE 'href="[^"]+"' \
    | sed 's/href="//;s/"$//')

  if echo "$CANONICAL" | grep -q "ezq.com"; then
    CANON_STATUS="✅ ${CANONICAL}"
  elif [ -z "$CANONICAL" ]; then
    CANON_STATUS="⏳ no canonical"
  else
    CANON_STATUS="⚠  ${CANONICAL}"
  fi

  LINE="${TS} | DNS:${IP_STATUS} | HTTP:${HTTP} | ${SSL_STATUS} | Canonical:${CANON_STATUS}"
  echo "$LINE"
  echo "$LINE" >> "$LOG"

  # Declare victory when all three look good
  if [ "$RESOLVED" = "$SHOPIFY_IP" ] && [ "$HTTP" = "200" ] && echo "$CANONICAL" | grep -q "ezq.com"; then
    MSG="${TS} | 🟢 CUTOVER COMPLETE — DNS resolved, HTTP 200, canonical is ezq.com"
    echo ""
    echo "$MSG"
    echo "$MSG" >> "$LOG"
    echo ""
    echo "Next steps:"
    echo "  1. Set ezq.com as primary domain in Shopify admin (Online Store → Domains)"
    echo "  2. Run: node scripts/migration/07-post-cutover.js"
    echo "  3. Submit https://ezq.com/sitemap.xml to Google Search Console"
    break
  fi

  sleep 300
done
