#!/usr/bin/env bash
set -euo pipefail

THEME_ID="${SHOPIFY_THEME_ID:-150294855878}"
STORE="${SHOPIFY_STORE:-ezquest-4.myshopify.com}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups"
STAMP="$(date +%Y%m%d)"
DEST="$BACKUP_DIR/theme-$STAMP"

mkdir -p "$BACKUP_DIR"

if [ -d "$DEST" ]; then
  DEST="$BACKUP_DIR/theme-$STAMP-$(date +%H%M%S)"
fi

shopify theme pull \
  --theme="$THEME_ID" \
  --store="$STORE" \
  --output "$DEST"

find "$BACKUP_DIR" -maxdepth 1 -type d -name 'theme-*' | sort -r | tail -n +6 | xargs -r rm -rf

echo "Backup saved: ${DEST#$ROOT_DIR/}"
