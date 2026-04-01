function createSummary(name, dryRun) {
  return {
    name,
    dryRun,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    notes: []
  };
}

function bump(summary, key, note) {
  summary[key] += 1;
  if (note) {
    summary.notes.push(note);
  }
}

function printSummary(summary) {
  console.log("");
  console.log(`[shopify-admin] ${summary.name} summary${summary.dryRun ? " (dry run)" : ""}`);
  console.log(`- created: ${summary.created}`);
  console.log(`- updated: ${summary.updated}`);
  console.log(`- skipped: ${summary.skipped}`);
  console.log(`- failed: ${summary.failed}`);

  if (summary.notes.length > 0) {
    console.log("- notes:");
    for (const note of summary.notes) {
      console.log(`  - ${note}`);
    }
  }
}

module.exports = {
  createSummary,
  bump,
  printSummary
};
