const normalizedCatalog = require("../../../docs/ezquest-product-sheet-normalized.json");

const PRODUCT_IMAGE_SETS = {
  Hub: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80"
  ],
  Dock: [
    "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1400&q=80"
  ],
  Charger: [
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80"
  ],
  Cable: [
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80"
  ],
  Adapter: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80"
  ],
  Accessory: [
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80"
  ]
};

function inferProductType(handle, familyName) {
  const source = `${handle} ${familyName}`.toLowerCase();

  if (source.includes("dock")) {
    return "Dock";
  }
  if (source.includes("hub")) {
    return "Hub";
  }
  if (source.includes("charger") || source.includes("power")) {
    return "Charger";
  }
  if (source.includes("cable")) {
    return "Cable";
  }
  if (source.includes("adapter")) {
    return "Adapter";
  }

  return "Accessory";
}

function buildTemporaryImageUrls(productType) {
  return PRODUCT_IMAGE_SETS[productType] || PRODUCT_IMAGE_SETS.Accessory;
}

function buildVariantTitle(optionNames, child) {
  const parts = optionNames
    .map((optionName) => {
      if (optionName === "Color") {
        return child.color;
      }
      if (optionName === "Length") {
        return child.length;
      }
      return null;
    })
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "Default Title";
}

function buildOptionValues(optionNames, child) {
  const values = {};

  for (const optionName of optionNames) {
    if (optionName === "Color" && child.color) {
      values.Color = child.color;
    } else if (optionName === "Length" && child.length) {
      values.Length = child.length;
    }
  }

  return values;
}

function buildDescription(productType, familyName) {
  switch (productType) {
    case "Hub":
      return `<p>The EZQuest ${familyName} is built for customers who need compact USB-C expansion for displays, charging, and everyday accessories without turning the setup into a cable mess.</p>`;
    case "Dock":
      return `<p>The EZQuest ${familyName} is designed for desk-first setups that need stronger display support, more ports, cleaner cable management, and a more stable everyday workstation.</p>`;
    case "Charger":
      return `<p>The EZQuest ${familyName} keeps notebooks, tablets, and phones charged with less clutter whether the setup lives on a desk, in a travel bag, or between both.</p>`;
    case "Cable":
      return `<p>The EZQuest ${familyName} keeps charging and sync paths dependable with the right cable length for everyday carry, desktop use, and cleaner setup management.</p>`;
    case "Adapter":
      return `<p>The EZQuest ${familyName} bridges common connection gaps so modern devices can keep working with the accessories, storage, and peripherals customers still use every day.</p>`;
    default:
      return `<p>The EZQuest ${familyName} supports cleaner modern-device workflows with practical connectivity that stays easy to understand and easy to own.</p>`;
  }
}

function buildNormalizedSeedProduct(parent) {
  const optionNames = [parent.variant_option_1, parent.variant_option_2].filter(Boolean);
  const productType = inferProductType(parent.parent_handle, parent.normalized_family_name);
  const firstChild = parent.children[0];

  return {
    title: parent.normalized_family_name,
    handle: parent.parent_handle,
    vendor: "EZQuest",
    productType,
    status: "ACTIVE",
    price: firstChild.price || "0.00",
    sku: firstChild.sku,
    descriptionHtml: buildDescription(productType, parent.normalized_family_name),
    imageUrls: buildTemporaryImageUrls(productType),
    optionNames,
    variants: parent.children.map((child) => {
      const compareAtPrice = child.msrp || child.map || null;

      return {
        title: buildVariantTitle(optionNames, child),
        sku: child.sku,
        price: child.price || firstChild.price || "0.00",
        compareAtPrice: compareAtPrice && compareAtPrice !== child.price ? compareAtPrice : null,
        barcode: child.upc || null,
        inventoryPolicy: "CONTINUE",
        optionValues: buildOptionValues(optionNames, child),
        isEol: Boolean(child.is_eol),
        status: child.status || "Shipping"
      };
    })
  };
}

const coreProducts = [
  {
    title: "USB-C Multimedia Hub",
    handle: "usb-c-multimedia-hub",
    vendor: "EZQuest",
    productType: "Hub",
    status: "ACTIVE",
    price: "99.00",
    sku: "EZQ-HUB-001",
    descriptionHtml:
      "<p>The EZQuest USB-C Multimedia Hub is the balanced everyday hub for Mac, PC, and tablet users who want 4K HDMI, pass-through charging, wired networking, and removable-media access through one compact USB-C connection.</p>",
    imageUrls: buildTemporaryImageUrls("Hub")
  },
  {
    title: "USB-C Travel Hub",
    handle: "usb-c-travel-hub",
    vendor: "EZQuest",
    productType: "Hub",
    status: "ACTIVE",
    price: "69.00",
    sku: "EZQ-HUB-002",
    descriptionHtml:
      "<p>The EZQuest USB-C Travel Hub keeps mobile setups light with HDMI, USB access, and pass-through charging for hotel desks, meeting rooms, classrooms, and everyday work away from the main workstation.</p>",
    imageUrls: buildTemporaryImageUrls("Hub")
  },
  {
    title: "USB-C Pro Dock",
    handle: "usb-c-pro-dock",
    vendor: "EZQuest",
    productType: "Dock",
    status: "ACTIVE",
    price: "199.00",
    sku: "EZQ-DOCK-001",
    descriptionHtml:
      "<p>The EZQuest USB-C Pro Dock is built for permanent desk setups that need more ports, cleaner cable management, stable display support, wired networking, and a clearer upgrade path from compact travel or multimedia hubs.</p>",
    imageUrls: buildTemporaryImageUrls("Dock")
  }
];

const normalizedProducts = (normalizedCatalog.parents || []).map(buildNormalizedSeedProduct);

module.exports = [...coreProducts, ...normalizedProducts];
