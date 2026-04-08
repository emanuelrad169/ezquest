const seedProducts = require("./products");

const USE_CASES = [
  {
    title: "Balanced everyday",
    slug: "balanced-everyday",
    description: "Built for everyday setups that need reliable display, charging, and accessory support without moving up to a full dock.",
    sort_order: 10
  },
  {
    title: "Portable",
    slug: "portable",
    description: "Built for travel-ready setups, mobile work, and lighter everyday carry where flexibility matters more than a permanent desk footprint.",
    sort_order: 20
  },
  {
    title: "Desk-ready",
    slug: "desk-ready",
    description: "Built for permanent desks and workstation-style setups with more peripherals, more display demands, and a cleaner long-session footprint.",
    sort_order: 30
  },
  {
    title: "Chargers & power",
    slug: "chargers-power",
    description: "Built for charging layers that keep notebooks, tablets, and phones powered with less clutter across desks, travel kits, and shared setups.",
    sort_order: 40
  }
];

function buildUseCaseEntries(products) {
  return USE_CASES.map((useCase) => ({
    ...useCase,
    productHandles: products
      .filter((product) => Array.isArray(product.useCaseHandles) && product.useCaseHandles.includes(useCase.slug))
      .map((product) => product.handle)
  })).filter((useCase) => useCase.productHandles.length > 0);
}

module.exports = {
  useCases: buildUseCaseEntries(seedProducts),
  products: [
    {
      handle: "usb-c-multimedia-hub",
      title: "USB-C Multimedia Hub",
      compareRole: "balanced",
      recommendedPriority: 1,
      bestFor: "Everyday desks that need display, charging, Ethernet, and accessory access",
      compareShortReason: "The most balanced choice for customers who want a fuller port mix without stepping up to a permanent desk dock.",
      supportSummaryHtml: "<p>The EZQuest USB-C Multimedia Hub supports the everyday desk with HDMI, charging, Ethernet, USB expansion, and card-reader access in one compact adapter that stays easy to set up and support.</p>",
      compatibilitySummaryHtml: "<p>Best for Mac, PC, and tablet users who want one everyday hub for a single external display, charging, wired networking, and accessory access.</p>",
      featureHighlights: [
        "Balanced everyday hub for desk and hybrid work setups",
        "4K HDMI output for cleaner single-display setups",
        "USB-C pass-through charging up to 100W",
        "USB-A and USB-C data ports for everyday peripherals",
        "Ethernet plus SD and microSD access for media and office workflows"
      ],
      specRows: [
        { label: "Ports", spec_value: "2 x USB-A 5Gbps, 1 x USB-C data, HDMI, SD, microSD, Gigabit Ethernet", sort_order: 10 },
        { label: "Power delivery", spec_value: "USB-C pass-through charging up to 100W", sort_order: 20 },
        { label: "Display support", spec_value: "Single HDMI display up to 4K at 60Hz on supported hosts", sort_order: 30 },
        { label: "Host compatibility", spec_value: "USB-C and Thunderbolt laptops and tablets with display-capable USB-C", sort_order: 40 }
      ],
      manuals: [
        {
          title: "USB-C Multimedia Hub Quick-Start Guide",
          manual_type: "Quick Start",
          summary: "Covers port overview, display connection, charging setup, and first-use steps for the USB-C Multimedia Hub on the everyday desk.",
          version: "v1.2",
          language: "English",
          button_label: "Open guide",
          platforms: ["macOS", "Windows", "iPadOS"],
          sort_order: 10
        },
        {
          title: "USB-C Multimedia Hub Full User Guide",
          manual_type: "User Guide",
          summary: "Detailed reference for display support, Ethernet setup, card reader usage, and day-to-day desk recommendations.",
          version: "v1.0",
          language: "English",
          button_label: "Open guide",
          platforms: ["macOS", "Windows", "ChromeOS"],
          sort_order: 20
        }
      ],
      userGuides: [
        {
          title: "USB-C Multimedia Hub Setup Checklist",
          guide_type: "Setup Checklist",
          summary: "Step-by-step setup checklist for display, charging, Ethernet, and accessory readiness on the everyday desk.",
          version: "v1.0",
          button_label: "Open guide",
          platforms: ["macOS", "Windows", "iPadOS"],
          workflows: ["everyday-desk"],
          sort_order: 10
        },
        {
          title: "USB-C Multimedia Hub Presentation Workflow Guide",
          guide_type: "Workflow Guide",
          summary: "Meeting-room and classroom workflow setup guidance for stable HDMI output and accessory reliability.",
          version: "v1.0",
          button_label: "Open guide",
          platforms: ["macOS", "Windows"],
          workflows: ["presentation", "conference-room"],
          sort_order: 20
        }
      ],
      downloads: [
        {
          title: "USB-C Multimedia Hub Windows Driver",
          download_type: "Driver",
          summary: "Windows driver package for stable Ethernet and peripheral support in managed workstation environments and shared office fleets.",
          version: "v2.0.1",
          button_label: "Download file",
          platforms: ["Windows"],
          sort_order: 10
        }
      ],
      firmware: [
        {
          title: "USB-C Multimedia Hub Firmware Update Utility",
          firmware_type: "Firmware Update",
          summary: "Improves display handshake stability, card-reader reliability, and peripheral reconnect behavior.",
          version: "v1.4.2",
          button_label: "Download firmware",
          platforms: ["macOS", "Windows"],
          sort_order: 10
        }
      ],
      compatibilityEntries: [
        {
          title: "macOS / MacBook Pro / dual-display guidance",
          platform: "macOS",
          device: "MacBook Pro",
          workflow: "dual-display",
          status: "Recommended",
          summary: "Best for MacBook Pro users who want one primary external display plus charging, Ethernet, storage access, and accessories through one everyday hub.",
          sort_order: 10
        },
        {
          title: "Windows / USB-C laptop / conference-room setup",
          platform: "Windows",
          device: "USB-C laptop",
          workflow: "conference-room",
          status: "Recommended",
          summary: "A strong fit for Windows laptops that need HDMI output, USB accessories, wired networking, and pass-through charging in shared desks or meeting rooms.",
          sort_order: 20
        }
      ],
      faqs: [
        {
          question: "Does the USB-C Multimedia Hub support dual display setups?",
          answer: "The hub is positioned around a single HDMI display. If your setup depends on multiple displays, step up to a dock or review compatibility guidance before ordering.",
          faq_group: "Support",
          sort_order: 10
        },
        {
          question: "Do I need drivers to use the USB-C Multimedia Hub?",
          answer: "Most everyday hub functions work plug-and-play, but some Windows environments may still benefit from the included driver package for best compatibility.",
          faq_group: "Support",
          sort_order: 20
        },
        {
          question: "Which devices are the best fit for the USB-C Multimedia Hub?",
          answer: "It is best suited to USB-C and Thunderbolt laptops and tablets that need HDMI output, charging, Ethernet, storage access, and everyday peripheral expansion through one hub.",
          faq_group: "Choosing",
          sort_order: 30
        }
      ]
    },
    {
      handle: "usb-c-travel-hub",
      title: "USB-C Travel Hub",
      compareRole: "portable",
      recommendedPriority: 2,
      bestFor: "Travel kits, meeting rooms, and lighter mobile setups",
      compareShortReason: "The lightest carry-friendly option for customers who care more about mobility and presentation-ready basics than maximum expansion.",
      supportSummaryHtml: "<p>The EZQuest USB-C Travel Hub is built for mobile setups that still need HDMI output, charging passthrough, and the core ports needed for meetings, hotel desks, classrooms, and everyday carry.</p>",
      compatibilitySummaryHtml: "<p>Best for lighter mobile setups where portability matters more than maximum port count or a permanent desktop footprint.</p>",
      featureHighlights: [
        "Compact USB-C expansion for travel-ready setups",
        "HDMI output for presentations and hotel-desk work",
        "Pass-through charging to keep laptop power connected",
        "Streamlined port mix for lighter mobile workflows and everyday carry"
      ],
      specRows: [
        { label: "Ports", spec_value: "HDMI, USB-A, USB-C charging, and everyday expansion ports for mobile use", sort_order: 10 },
        { label: "Power delivery", spec_value: "USB-C pass-through charging for travel and hot-desk setups", sort_order: 20 },
        { label: "Display support", spec_value: "Single external display support for common presentation and workspace use", sort_order: 30 },
        { label: "Host compatibility", spec_value: "USB-C laptops and tablets that need lightweight expansion on the go", sort_order: 40 }
      ],
      manuals: [
        {
          title: "USB-C Travel Hub Quick-Start Guide",
          manual_type: "Quick Start",
          summary: "First-use setup guide for HDMI, charging passthrough, and accessory connection on the USB-C Travel Hub when working away from the main desk.",
          version: "v1.0",
          language: "English",
          button_label: "Open guide",
          platforms: ["macOS", "Windows", "iPadOS"],
          sort_order: 10
        },
        {
          title: "USB-C Travel Hub Full User Guide",
          manual_type: "User Guide",
          summary: "Longer-form reference for host compatibility, presentation workflows, and recommended hotel-desk or shared-room usage.",
          version: "v1.0",
          language: "English",
          button_label: "Open guide",
          platforms: ["macOS", "Windows", "ChromeOS"],
          sort_order: 20
        }
      ],
      userGuides: [
        {
          title: "USB-C Travel Hub Mobile Setup Guide",
          guide_type: "Setup Guide",
          summary: "Mobile setup guidance for presentation, hotel-desk, and meeting workflows with minimal cable clutter.",
          version: "v1.0",
          button_label: "Open guide",
          platforms: ["macOS", "Windows", "iPadOS"],
          workflows: ["travel-work", "mobile-presentation"],
          sort_order: 10
        },
        {
          title: "USB-C Travel Hub Packing + Carry Guide",
          guide_type: "Carry Guide",
          summary: "Best practices for travel packing, accessory pairing, and fast setup on the go.",
          version: "v1.0",
          button_label: "Open guide",
          platforms: ["macOS", "Windows"],
          workflows: ["travel"],
          sort_order: 20
        }
      ],
      downloads: [
        {
          title: "USB-C Travel Hub Windows Driver",
          download_type: "Driver",
          summary: "Windows driver support package for supported travel hub configurations in presentation and conference-room environments.",
          version: "v1.0.0",
          button_label: "Download file",
          platforms: ["Windows"],
          sort_order: 10
        }
      ],
      firmware: [
        {
          title: "USB-C Travel Hub Firmware Update Utility",
          firmware_type: "Firmware Update",
          summary: "Firmware updater for travel hub display negotiation and peripheral stability improvements.",
          version: "v1.1.0",
          button_label: "Download firmware",
          platforms: ["macOS", "Windows"],
          sort_order: 10
        }
      ],
      compatibilityEntries: [
        {
          title: "macOS / MacBook Air / travel-work setup",
          platform: "macOS",
          device: "MacBook Air",
          workflow: "travel-work",
          status: "Recommended",
          summary: "Best for customers who need HDMI output, charging, and a compact accessory footprint while moving between offices, classrooms, and travel stops.",
          sort_order: 10
        },
        {
          title: "Windows / USB-C ultrabook / mobile presentation setup",
          platform: "Windows",
          device: "USB-C ultrabook",
          workflow: "mobile-presentation",
          status: "Recommended",
          summary: "A compact fit for users who need projector or display output with fewer ports, less cable bulk, and faster pack-out between locations.",
          sort_order: 20
        }
      ],
      faqs: [
        {
          question: "Is the USB-C Travel Hub best for mobile setups?",
          answer: "Yes. It is positioned for users who want lighter everyday expansion for travel, meetings, and smaller workspace setups.",
          faq_group: "Choosing",
          sort_order: 10
        },
        {
          question: "Can I keep my laptop charging while using the USB-C Travel Hub?",
          answer: "Yes. The travel hub supports pass-through charging so customers can keep power connected while using the hub.",
          faq_group: "Support",
          sort_order: 20
        },
        {
          question: "Should I choose the travel hub or the multimedia hub?",
          answer: "Choose the travel hub for compact mobility, lighter port needs, and easier packing. Choose the multimedia hub for a broader everyday desk setup with Ethernet, card readers, and more support for accessories.",
          faq_group: "Choosing",
          sort_order: 30
        }
      ]
    },
    {
      handle: "usb-c-pro-dock",
      title: "USB-C Pro Dock",
      compareRole: "desk",
      recommendedPriority: 3,
      bestFor: "Permanent desk setups with more displays and peripherals",
      compareShortReason: "The desk-first step up for customers who need broader connectivity, stronger workstation support, and less compromise at a fixed setup.",
      supportSummaryHtml: "<p>The EZQuest USB-C Pro Dock is built for permanent desk setups that need broader connectivity, better cable control, external displays, wired networking, and a clearer step up from travel or multimedia hubs.</p>",
      compatibilitySummaryHtml: "<p>Best for Mac and Windows users building a more stable workstation with more peripherals, stronger desk organization, and a clearer dock-vs-hub buying decision.</p>",
      featureHighlights: [
        "Expanded connectivity for permanent desk setups",
        "Better fit for dual-display-style workflows and more peripherals",
        "Stronger upgrade path from compact travel and multimedia hubs",
        "Support-ready dock experience for longer-term ownership"
      ],
      specRows: [
        { label: "Ports", spec_value: "Expanded desktop-oriented connectivity for displays, peripherals, charging, and wired workstation use", sort_order: 10 },
        { label: "Power delivery", spec_value: "USB-C power support for desk-based workflows with more connected devices", sort_order: 20 },
        { label: "Display support", spec_value: "Higher-capacity external display support compared with lighter travel configurations", sort_order: 30 },
        { label: "Host compatibility", spec_value: "USB-C and Thunderbolt laptops used in permanent or semi-permanent desk setups", sort_order: 40 }
      ],
      manuals: [
        {
          title: "USB-C Pro Dock Quick-Start Guide",
          manual_type: "Quick Start",
          summary: "Quick setup reference for connecting displays, power, Ethernet, and desktop peripherals on the USB-C Pro Dock.",
          version: "v1.0",
          language: "English",
          button_label: "Open guide",
          platforms: ["macOS", "Windows"],
          sort_order: 10
        },
        {
          title: "USB-C Pro Dock Full User Guide",
          manual_type: "User Guide",
          summary: "Detailed dock setup reference for desktop deployment, compatibility, firmware updates, and support escalation paths.",
          version: "v1.0",
          language: "English",
          button_label: "Open guide",
          platforms: ["macOS", "Windows", "ChromeOS"],
          sort_order: 20
        }
      ],
      userGuides: [
        {
          title: "USB-C Pro Dock Desk Setup Guide",
          guide_type: "Setup Guide",
          summary: "Desk-first setup guidance for multi-peripheral workstations, cable management, and long-session stability.",
          version: "v1.0",
          button_label: "Open guide",
          platforms: ["macOS", "Windows"],
          workflows: ["desk-workstation"],
          sort_order: 10
        },
        {
          title: "USB-C Pro Dock Workflow Tuning Guide",
          guide_type: "Workflow Guide",
          summary: "Recommendations for display mix, charging, and peripheral routing in permanent desk setups.",
          version: "v1.0",
          button_label: "Open guide",
          platforms: ["macOS", "Windows"],
          workflows: ["desk-workstation", "conference-room-and-desk"],
          sort_order: 20
        }
      ],
      downloads: [
        {
          title: "USB-C Pro Dock Windows Driver",
          download_type: "Driver",
          summary: "Windows driver package for supported dock workflows, desk deployments, and managed workstation environments.",
          version: "v2.1.0",
          button_label: "Download file",
          platforms: ["Windows"],
          sort_order: 10
        }
      ],
      firmware: [
        {
          title: "USB-C Pro Dock Firmware Update Utility",
          firmware_type: "Firmware Update",
          summary: "Firmware updater for dock stability, display negotiation, Ethernet reliability, and desktop peripheral support.",
          version: "v2.1.3",
          button_label: "Download firmware",
          platforms: ["macOS", "Windows"],
          sort_order: 10
        }
      ],
      compatibilityEntries: [
        {
          title: "macOS / MacBook Pro / desk-workstation setup",
          platform: "macOS",
          device: "MacBook Pro",
          workflow: "desk-workstation",
          status: "Recommended",
          summary: "A strong choice for MacBook Pro users building a more stable desk setup with more connected peripherals and long-session productivity needs.",
          sort_order: 10
        },
        {
          title: "Windows / USB-C laptop / conference-room plus desk setup",
          platform: "Windows",
          device: "USB-C laptop",
          workflow: "conference-room-and-desk",
          status: "Recommended",
          summary: "Designed for users who need one solution that covers desk deployment, docking convenience, and shared display environments with more connected peripherals.",
          sort_order: 20
        }
      ],
      faqs: [
        {
          question: "Who should choose the USB-C Pro Dock?",
          answer: "Customers should choose the Pro Dock when they need more ports, stronger display support, Ethernet, and a more permanent desk setup than a travel hub or compact multimedia hub can provide.",
          faq_group: "Choosing",
          sort_order: 10
        },
        {
          question: "Is the USB-C Pro Dock better for desktop setups than the travel hub?",
          answer: "Yes. The Pro Dock is intended for more permanent desk use, broader peripheral support, and higher-capacity workflows.",
          faq_group: "Choosing",
          sort_order: 20
        },
        {
          question: "Does the USB-C Pro Dock have dedicated setup and firmware resources?",
          answer: "Yes. The structured support model includes separate manuals, downloads, compatibility guidance, and FAQ items for the Pro Dock.",
          faq_group: "Support",
          sort_order: 30
        }
      ]
    }
  ],
  comparisonGroups: [
    {
      title: "USB-C workspace connectivity lineup",
      heading: "Choose the right EZQuest connectivity setup",
      key: "usb-c-workspace-connectivity-lineup",
      slug: "usb-c-workspace-connectivity-lineup",
      eyebrow: "Compare",
      description: "Compare travel-first portability, balanced everyday expansion, and workstation-ready desktop connectivity before you buy.",
      use_case: "USB-C workspace connectivity",
      group_type: "USB-C Connectivity",
      cta_label: "View product",
      support_note: "Use compare to narrow by port mix, display needs, and desk-versus-travel fit before escalating to support.",
      productHandles: ["usb-c-multimedia-hub", "usb-c-travel-hub", "usb-c-pro-dock"],
      defaultProductHandles: ["usb-c-multimedia-hub", "usb-c-travel-hub", "usb-c-pro-dock"]
    },
    {
      title: "Travel and desk wall chargers",
      heading: "Choose the right EZQuest wall charger",
      key: "travel-and-desk-wall-chargers",
      slug: "travel-and-desk-wall-chargers",
      eyebrow: "Compare",
      description: "Compare laptop-ready travel charging, slim dual-USB-C desk power, and lighter multi-device travel charging before you buy.",
      use_case: "Travel and desk charging",
      group_type: "Chargers & Power",
      cta_label: "View product",
      support_note: "Use compare to narrow by charging headroom, travel flexibility, and desk-versus-carry fit before moving into support.",
      productHandles: [
        "worldtravel-65w-gan-5-port-pd-wall-charger",
        "ultraslim-wall-charger-dual-usb-c-70w",
        "worldtravel-35w-gan-5-port-pd-wall-charger"
      ],
      defaultProductHandles: [
        "worldtravel-65w-gan-5-port-pd-wall-charger",
        "ultraslim-wall-charger-dual-usb-c-70w",
        "worldtravel-35w-gan-5-port-pd-wall-charger"
      ]
    },
    {
      title: "DuraGuard charge and sync cables",
      heading: "Choose the right DuraGuard cable",
      key: "duraguard-charge-and-sync-cables",
      slug: "duraguard-charge-and-sync-cables",
      eyebrow: "Compare",
      description: "Compare USB-C to USB-C power delivery and USB-C to USB-A legacy compatibility so you can pick the right everyday DuraGuard cable faster.",
      use_case: "Charge and sync cables",
      group_type: "Cables & Charging",
      cta_label: "View product",
      support_note: "Use compare to confirm connector type, charging headroom, and legacy-device fit before you buy the wrong cable.",
      productHandles: [
        "duraguard-usb-c-to-usb-c-charge-and-sync-cable",
        "duraguard-usb-c-to-usb-a-charge-and-sync-cable"
      ],
      defaultProductHandles: [
        "duraguard-usb-c-to-usb-c-charge-and-sync-cable",
        "duraguard-usb-c-to-usb-a-charge-and-sync-cable"
      ]
    },
    {
      title: "UltimatePower wall chargers",
      heading: "Choose the right UltimatePower wall charger",
      key: "ultimatepower-wall-chargers",
      slug: "ultimatepower-wall-chargers",
      eyebrow: "Compare",
      description: "Compare lighter dual-USB-C carry charging, balanced everyday laptop power, and higher-output desk charging before you buy.",
      use_case: "UltimatePower wall charging",
      group_type: "Chargers & Power",
      cta_label: "View product",
      support_note: "Use compare to narrow by charging output, port configuration, and travel-versus-desk fit before moving deeper into support.",
      productHandles: [
        "65w-gan-usb-c-pd-wall-charger",
        "ultimatepower-90w-gan-usb-c-pd-wall-charger",
        "45w-gan-usb-c-pd-wall-charger",
        "ultimatepower-120w-gan-usb-c-pd-wall-charger"
      ],
      defaultProductHandles: [
        "65w-gan-usb-c-pd-wall-charger",
        "ultimatepower-90w-gan-usb-c-pd-wall-charger",
        "45w-gan-usb-c-pd-wall-charger",
        "ultimatepower-120w-gan-usb-c-pd-wall-charger"
      ]
    }
  ],
  compareAssignments: [
    {
      handle: "worldtravel-65w-gan-5-port-pd-wall-charger",
      compareGroupKey: "travel-and-desk-wall-chargers",
      compareRole: "balanced",
      recommendedPriority: 1,
      bestFor: "International travel kits that still need laptop, tablet, and phone charging from one adapter",
      compareShortReason: "The best balance of travel flexibility and charging headroom, with 65W USB-C PD, five total ports, and built-in world-travel coverage."
    },
    {
      handle: "ultraslim-wall-charger-dual-usb-c-70w",
      compareGroupKey: "travel-and-desk-wall-chargers",
      compareRole: "desk",
      recommendedPriority: 2,
      bestFor: "Desk setups and lighter carry kits that want slim dual USB-C charging without extra bulk",
      compareShortReason: "The slimmest dual-USB-C option, delivering up to 70W total output when cleaner everyday USB-C charging matters more than international plug coverage."
    },
    {
      handle: "worldtravel-35w-gan-5-port-pd-wall-charger",
      compareGroupKey: "travel-and-desk-wall-chargers",
      compareRole: "portable",
      recommendedPriority: 3,
      bestFor: "Phones, tablets, and lighter travel kits that value global plug coverage and multi-device charging",
      compareShortReason: "The most portable world-travel choice for lighter charging loads, pairing 35W USB-C PD with five total ports and broad outlet compatibility."
    },
    {
      handle: "duraguard-usb-c-to-usb-c-charge-and-sync-cable",
      compareGroupKey: "duraguard-charge-and-sync-cables",
      compareRole: "balanced",
      recommendedPriority: 1,
      bestFor: "USB-C laptops, tablets, and phones that need one durable everyday cable with full USB-C charging headroom",
      compareShortReason: "The best all-around DuraGuard cable when you need USB-C on both ends, up to 100W PD, and heavier-duty everyday durability.",
      compareConnectorType: "USB-C to USB-C",
      compareChargingPower: "Up to 100W PD / 480Mbps",
      compareFormFactor: "Straight braided cable with Kevlar reinforcement and E-Mark chipset",
      comparePortability: "Available in 1.2, 2, and 2.2 meter lengths"
    },
    {
      handle: "duraguard-usb-c-to-usb-a-charge-and-sync-cable",
      compareGroupKey: "duraguard-charge-and-sync-cables",
      compareRole: "portable",
      recommendedPriority: 2,
      bestFor: "USB-C devices that still charge or sync through USB-A chargers, power banks, and older accessory ports",
      compareShortReason: "The right pick when you still rely on USB-A chargers or legacy USB ports and want a durable cable for lighter charging and sync.",
      compareConnectorType: "USB-C to USB-A",
      compareChargingPower: "Up to 3A / 480Mbps",
      compareFormFactor: "Straight braided cable with Kevlar reinforcement",
      comparePortability: "Available in 1.2 and 2.2 meter lengths"
    },
    {
      handle: "65w-gan-usb-c-pd-wall-charger",
      compareGroupKey: "ultimatepower-wall-chargers",
      compareRole: "balanced",
      recommendedPriority: 1,
      bestFor: "Everyday laptop, tablet, and phone charging that wants stronger 3-port flexibility without stepping up to the largest charger",
      compareShortReason: "The best all-around UltimatePower choice, pairing up to 65W charging with 2 USB-C ports, 1 USB-A port, and an included 1.8 meter USB-C cable.",
      compareChargingPower: "Up to 65W total output",
      compareFormFactor: "3-port GaN II wall charger with foldable US plugs and included USB-C cable",
      comparePortability: "Balanced carry-and-desk fit with 2 USB-C ports, 1 USB-A port, and a 1.8 meter USB-C cable"
    },
    {
      handle: "ultimatepower-90w-gan-usb-c-pd-wall-charger",
      compareGroupKey: "ultimatepower-wall-chargers",
      compareRole: "desk",
      recommendedPriority: 2,
      bestFor: "Higher-output notebook and multi-device charging where more headroom matters more than the lightest travel footprint",
      compareShortReason: "Steps up to 90W total output while keeping 2 USB-C ports, 1 USB-A port, a 2 meter USB-C cable, and an EU converter in the box.",
      compareChargingPower: "Up to 90W total output",
      compareFormFactor: "3-port GaN wall charger bundle with USB-C cable and EU converter",
      comparePortability: "Desk-leaning charger bundle with a 2 meter USB-C cable and EU converter when you still need some travel flexibility"
    },
    {
      handle: "45w-gan-usb-c-pd-wall-charger",
      compareGroupKey: "ultimatepower-wall-chargers",
      compareRole: "portable",
      recommendedPriority: 3,
      bestFor: "Phones, tablets, and lighter USB-C notebook charging when compact dual-USB-C carry matters most",
      compareShortReason: "The lightest UltimatePower option, keeping charging simple with 2 USB-C ports, foldable US plugs, and up to 45W total output.",
      compareChargingPower: "Up to 45W total output",
      compareFormFactor: "Dual USB-C GaN II wall charger with built-in foldable US plugs",
      comparePortability: "Most portable charging tier with 2 USB-C ports and a lighter everyday carry fit"
    },
    {
      handle: "ultimatepower-120w-gan-usb-c-pd-wall-charger",
      compareGroupKey: "ultimatepower-wall-chargers",
      compareRole: "desk",
      recommendedPriority: 4,
      bestFor: "Highest-output desk charging for heavier laptop loads and multi-device charging where maximum wattage leads the decision",
      compareShortReason: "The power-first option, delivering up to 120W total output with 2 USB-C ports, 1 USB-A port, a 2 meter USB-C cable, and an EU converter.",
      compareChargingPower: "Up to 120W total output",
      compareFormFactor: "High-output 3-port GaN wall charger bundle with USB-C cable and EU converter",
      comparePortability: "Least carry-focused option, built for higher-output desk charging with the fuller charger bundle in the box"
    }
  ],
  troubleshootingItems: [
    {
      title: "Display not detected",
      issue_type: "Display",
      summary: "Confirm cable path, display input, and host support first, then validate the correct port and adapter chain.",
      primary_label: "Check compatibility",
      primary_url: "/pages/compatibility",
      secondary_label: "View manuals",
      secondary_url: "/pages/manuals",
      platforms: ["macOS", "Windows"],
      workflows: ["single-display", "dual-display"],
      productHandles: ["usb-c-multimedia-hub", "usb-c-travel-hub", "usb-c-pro-dock"],
      sort_order: 10
    },
    {
      title: "Device not charging as expected",
      issue_type: "Power",
      summary: "Confirm charger wattage, power-delivery support, and the full USB-C path before escalating the issue.",
      primary_label: "View downloads",
      primary_url: "/pages/downloads",
      secondary_label: "Contact support",
      secondary_url: "/pages/contact",
      platforms: ["macOS", "Windows"],
      workflows: ["everyday-desk", "travel-work"],
      productHandles: ["usb-c-multimedia-hub", "usb-c-travel-hub", "usb-c-pro-dock"],
      sort_order: 20
    },
    {
      title: "Accessory or drive not appearing",
      issue_type: "Accessories",
      summary: "Review port type, adapter chain, and platform support, then verify drivers or firmware if required.",
      primary_label: "Open downloads",
      primary_url: "/pages/downloads",
      secondary_label: "View manuals",
      secondary_url: "/pages/manuals",
      platforms: ["macOS", "Windows"],
      workflows: ["everyday-desk", "desk-workstation"],
      productHandles: ["usb-c-multimedia-hub", "usb-c-pro-dock"],
      sort_order: 30
    },
    {
      title: "Setup still not working",
      issue_type: "Escalation",
      summary: "Move from symptom checks into manuals, downloads, or direct support when the faster path is no longer enough.",
      primary_label: "Open support",
      primary_url: "/pages/support",
      secondary_label: "Contact support",
      secondary_url: "/pages/contact",
      platforms: ["macOS", "Windows"],
      workflows: ["support-escalation"],
      productHandles: ["usb-c-multimedia-hub", "usb-c-travel-hub", "usb-c-pro-dock"],
      sort_order: 40
    }
  ],
  decisionGuideEntries: [
    {
      title: "Balanced everyday setup",
      role_label: "Everyday desk",
      summary: "Best for everyday desks that need HDMI, charging, Ethernet, and accessory access without a full dock footprint.",
      primary_label: "View multimedia hubs",
      primary_url: "/collections/hubs-adapters",
      secondary_label: "Compare options",
      secondary_url: "/pages/compare",
      workflows: ["everyday-desk"],
      productHandles: ["usb-c-multimedia-hub"],
      sort_order: 10
    },
    {
      title: "Portable travel setup",
      role_label: "Travel / meetings",
      summary: "Best for travel and mobile setups that prioritize compact carry with presentation-ready HDMI and charging.",
      primary_label: "View travel hubs",
      primary_url: "/collections/hubs-adapters",
      secondary_label: "Check compatibility",
      secondary_url: "/pages/compatibility",
      workflows: ["travel-work", "mobile-presentation"],
      productHandles: ["usb-c-travel-hub"],
      sort_order: 20
    },
    {
      title: "Desk-ready workstation",
      role_label: "Workstation",
      summary: "Best for permanent desk setups that need expanded connectivity, more peripherals, and longer-session stability.",
      primary_label: "View docking stations",
      primary_url: "/collections/docking-stations",
      secondary_label: "Compare options",
      secondary_url: "/pages/compare",
      workflows: ["desk-workstation"],
      productHandles: ["usb-c-pro-dock"],
      sort_order: 30
    }
  ]
};
