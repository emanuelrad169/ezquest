#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("fs");

const TEMPLATE_FILE = "templates/collection.json";
const PROMO_FILES = JSON.parse(fs.readFileSync("scripts/promo-banner-files.json", "utf8"));

const PROMO_SETTINGS = {
  "promo-ready-for-desk.jpg": "promo_ready_for_desk_image",
  "promo-power-up.jpg": "promo_power_up_image",
  "promo-duraguard-cables.jpg": "promo_duraguard_cables_image",
  "promo-travel-kit.jpg": "promo_travel_kit_image"
};

main();

function main() {
  const template = JSON.parse(fs.readFileSync(TEMPLATE_FILE, "utf8"));
  const sections = template.sections || {};
  const sectionEntries = Object.entries(sections).filter(([, section]) => section.type === "main-collection");

  if (sectionEntries.length === 0) {
    throw new Error("No main-collection section found in templates/collection.json.");
  }

  let total = 0;
  const actions = [];

  for (const [sectionKey, section] of sectionEntries) {
    section.settings = section.settings || {};

    for (const [filename, settingKey] of Object.entries(PROMO_SETTINGS)) {
      const file = PROMO_FILES[filename];

      if (!file || !file.fileReference) {
        actions.push({
          file: TEMPLATE_FILE,
          section: sectionKey,
          setting: settingKey,
          image: filename,
          status: "missing upload"
        });
        console.log(`NOT FOUND: ${filename}`);
        continue;
      }

      section.settings[settingKey] = file.fileReference;
      actions.push({
        file: TEMPLATE_FILE,
        section: sectionKey,
        setting: settingKey,
        image: filename,
        fileReference: file.fileReference,
        cdnUrl: file.cdnUrl,
        status: "wired"
      });
      total += 1;
      console.log(`WIRED: ${sectionKey}.${settingKey} -> ${file.fileReference}`);
    }
  }

  fs.writeFileSync(TEMPLATE_FILE, JSON.stringify(template, null, 2) + "\n");
  fs.writeFileSync("scripts/promo-banner-wiring-report.json", JSON.stringify(actions, null, 2) + "\n");

  console.log(`\nTotal wired: ${total}`);
  console.log("Saved: templates/collection.json");
  console.log("Saved: scripts/promo-banner-wiring-report.json");
}
