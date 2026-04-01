#!/bin/sh

BASE_URL="${ROUTE_QA_BASE:-http://127.0.0.1:9292}"
HAS_FAILURE=0

check_route() {
  route="$1"
  url="${BASE_URL}${route}"
  status="$(/usr/bin/curl -k -I -s -o /dev/null -w "%{http_code}" "$url")"

  case "$status" in
    2*|3*)
      printf 'OK %s %s\n' "$status" "$route"
      ;;
    *)
      printf 'FAIL %s %s\n' "$status" "$route"
      HAS_FAILURE=1
      ;;
  esac
}

check_route /
check_route /collections/hubs-adapters
check_route /products/usb-c-multimedia-hub
check_route /products/usb-c-travel-hub
check_route /products/usb-c-pro-dock
check_route /pages/compare
check_route /pages/downloads
check_route /pages/manuals
check_route /pages/compatibility
check_route /pages/faq
check_route /pages/support
check_route /cart
check_route /search

exit "$HAS_FAILURE"
