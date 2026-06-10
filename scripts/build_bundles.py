#!/usr/bin/env python3
"""
Build EZQuest bundle PRODUCTS via Shopify native Bundles (productBundleCreate).

PREREQUISITE: the free "Shopify Bundles" app must be installed (done).
Run:  python3 scripts/build_bundles.py
Reads creds from .env.local. Skips a bundle if its title already exists.
"""
import os, json, time, urllib.request

DOMAIN = os.environ["SHOPIFY_SHOP_DOMAIN"]
TOKEN  = os.environ["SHOPIFY_ADMIN_ACCESS_TOKEN"]
VER    = os.environ.get("SHOPIFY_ADMIN_API_VERSION", "2026-01")
URL    = f"https://{DOMAIN}/admin/api/{VER}/graphql.json"

def gql(q, v=None):
    req = urllib.request.Request(
        URL, data=json.dumps({"query": q, "variables": v or {}}).encode(),
        headers={"X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req))

# For multi-variant components, pin a single value per option so the bundle is fixed.
VALUE_OVERRIDES = {
    "P40065": {"Color": "Black"},
    "X48910": {"Color": "Space Gray", "Length": "1.2 Meter"},
}

BUNDLES = [
    {"title": "Mobile Pro Travel Kit",
     "skus": [("H30006", 1), ("P40065", 1), ("X48910", 1)],
     "list": 117.97, "price": 105.99},
    {"title": "Creator Storage Kit",
     "skus": [("X40021", 1), ("E12230", 1), ("C40012", 1)],
     "list": 139.97, "price": 125.99},
    {"title": "Ultimate Desktop Dock Kit",
     "skus": [("X40213", 1), ("X50120", 1), ("C20010", 1)],
     "list": 224.97, "price": 202.99},
    {"title": "4K Display Connect Kit",
     "skus": [("X40016", 1), ("X40014", 1), ("C20004", 1)],
     "list": 69.97, "price": 62.99},
    {"title": "Charge Everywhere Kit",
     "skus": [("X50090", 1), ("P20072", 1), ("X48910", 1)],
     "list": 122.97, "price": 110.99},
]

def fetch_components(skus):
    qf = " OR ".join(f"sku:{s}" for s in skus)
    q = """query($q:String){ products(first:40, query:$q){nodes{
      id title
      variants(first:1){nodes{sku}}
      options{id name optionValues{name}} }}}"""
    d = gql(q, {"q": qf})["data"]["products"]["nodes"]
    m = {}
    for p in d:
        sku = p["variants"]["nodes"][0]["sku"]
        m[sku] = {"pid": p["id"], "title": p["title"],
                  "options": [{"id": o["id"], "name": o["name"],
                               "values": [v["name"] for v in o["optionValues"]]}
                              for o in p["options"]]}
    return m

CREATE = """
mutation bundleCreate($input: ProductBundleCreateInput!) {
  productBundleCreate(input: $input) {
    productBundleOperation { id status }
    userErrors { field message }
  }
}"""
POLL = """
query op($id: ID!) {
  productOperation(id: $id) { ... on ProductBundleOperation {
    status
    product { id title handle status variants(first:1){nodes{id price}} }
    userErrors { field message } } }
}"""
PRICE = """
mutation setPrice($pid: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $pid, variants: $variants) {
    userErrors { field message } }
}"""
EXISTS = """query($q:String){ products(first:1, query:$q){nodes{id title}} }"""

def build_components(bundle, comp_map):
    comps = []
    seen_names = set()
    for sku, qty in bundle["skus"]:
        c = comp_map[sku]
        selections = []
        for o in c["options"]:
            ov = VALUE_OVERRIDES.get(sku, {})
            vals = [ov[o["name"]]] if o["name"] in ov else o["values"]
            # unique parent option name
            base = o["name"] if o["name"] != "Title" else c["title"]
            name = base[:80]
            n, k = name, 2
            while name in seen_names:
                name = f"{base[:74]} {k}"; k += 1
            seen_names.add(name)
            selections.append({"componentOptionId": o["id"], "name": name, "values": vals})
        comps.append({"quantity": qty, "productId": c["pid"], "optionSelections": selections})
    return comps

def main():
    all_skus = sorted({s for b in BUNDLES for s, _ in b["skus"]})
    comp_map = fetch_components(all_skus)
    missing = [s for s in all_skus if s not in comp_map]
    if missing:
        print("ABORT - components not found:", missing); return

    created = []
    for b in BUNDLES:
        ex = gql(EXISTS, {"q": f'title:"{b["title"]}"'})["data"]["products"]["nodes"]
        if ex:
            print(f"[SKIP] {b['title']} already exists ({ex[0]['id']})"); continue

        comps = build_components(b, comp_map)
        res = gql(CREATE, {"input": {"title": b["title"], "components": comps}})
        data = (res.get("data") or {}).get("productBundleCreate") or {}
        errs = data.get("userErrors") or res.get("errors")
        if errs:
            print(f"[FAIL] {b['title']}: {json.dumps(errs)}"); continue

        opid = data["productBundleOperation"]["id"]
        prod = None
        for _ in range(40):
            time.sleep(1.5)
            pr = gql(POLL, {"id": opid})["data"]["productOperation"]
            if pr["status"] == "COMPLETE": prod = pr["product"]; break
            if pr["status"] == "FAILED":
                print(f"[FAIL] {b['title']}: {json.dumps(pr.get('userErrors'))}"); break
        if not prod:
            print(f"[WARN] {b['title']}: operation did not complete in time"); continue

        vid = prod["variants"]["nodes"][0]["id"]
        pr = gql(PRICE, {"pid": prod["id"], "variants": [{"id": vid, "price": str(b["price"])}]})
        perr = (pr.get("data") or {}).get("productVariantsBulkUpdate", {}).get("userErrors") or pr.get("errors")
        tag = "price OK" if not perr else f"PRICE ERR {json.dumps(perr)}"
        save = round(b["list"] - b["price"], 2)
        print(f"[OK]   {b['title']} -> /{prod['handle']} (status {prod['status']}) "
              f"${b['price']} list ${b['list']} save ${save} [{tag}]")
        created.append(prod["handle"])
    print(f"\nDone. {len(created)} created.")

if __name__ == "__main__":
    main()
