const metaobjectDefinitions = [
  {
    name: "EZQuest Spec Row",
    type: "ezquest_spec_row",
    displayNameKey: "label",
    fieldDefinitions: [
      { name: "Label", key: "label", type: "single_line_text_field", required: true },
      { name: "Value", key: "spec_value", type: "multi_line_text_field", required: true },
      { name: "Sort order", key: "sort_order", type: "number_integer", required: false }
    ]
  },
  {
    name: "EZQuest Manual",
    type: "ezquest_manual",
    displayNameKey: "title",
    fieldDefinitions: [
      { name: "Title", key: "title", type: "single_line_text_field", required: true },
      { name: "Manual type", key: "manual_type", type: "single_line_text_field", required: true },
      { name: "Summary", key: "summary", type: "multi_line_text_field", required: false },
      { name: "File", key: "file", type: "file_reference", required: false },
      { name: "External URL", key: "external_url", type: "url", required: false },
      { name: "Button label", key: "button_label", type: "single_line_text_field", required: false },
      { name: "Version", key: "version", type: "single_line_text_field", required: false },
      { name: "Language", key: "language", type: "single_line_text_field", required: false },
      { name: "Platforms", key: "platforms", type: "list.single_line_text_field", required: false },
      { name: "Products", key: "products", type: "list.product_reference", required: false },
      { name: "Collections", key: "collections", type: "list.collection_reference", required: false },
      { name: "Sort order", key: "sort_order", type: "number_integer", required: false }
    ]
  },
  {
    name: "EZQuest Download",
    type: "ezquest_download",
    displayNameKey: "title",
    fieldDefinitions: [
      { name: "Title", key: "title", type: "single_line_text_field", required: true },
      { name: "Download type", key: "download_type", type: "single_line_text_field", required: true },
      { name: "Summary", key: "summary", type: "multi_line_text_field", required: false },
      { name: "File", key: "file", type: "file_reference", required: false },
      { name: "External URL", key: "external_url", type: "url", required: false },
      { name: "Button label", key: "button_label", type: "single_line_text_field", required: false },
      { name: "Version", key: "version", type: "single_line_text_field", required: false },
      { name: "Platforms", key: "platforms", type: "list.single_line_text_field", required: false },
      { name: "Products", key: "products", type: "list.product_reference", required: false },
      { name: "Collections", key: "collections", type: "list.collection_reference", required: false },
      { name: "Compatibility entries", key: "compatibility_entries", type: "list.metaobject_reference", required: false },
      { name: "Sort order", key: "sort_order", type: "number_integer", required: false }
    ]
  },
  {
    name: "EZQuest Compatibility Entry",
    type: "ezquest_compatibility_entry",
    displayNameKey: "title",
    fieldDefinitions: [
      { name: "Title", key: "title", type: "single_line_text_field", required: true },
      { name: "Platform", key: "platform", type: "single_line_text_field", required: false },
      { name: "Device", key: "device", type: "single_line_text_field", required: false },
      { name: "Workflow", key: "workflow", type: "single_line_text_field", required: false },
      { name: "Status", key: "status", type: "single_line_text_field", required: false },
      { name: "Summary", key: "summary", type: "multi_line_text_field", required: false },
      { name: "Products", key: "products", type: "list.product_reference", required: false },
      { name: "Collections", key: "collections", type: "list.collection_reference", required: false },
      { name: "Manuals", key: "manuals", type: "list.metaobject_reference", required: false },
      { name: "Downloads", key: "downloads", type: "list.metaobject_reference", required: false },
      { name: "Sort order", key: "sort_order", type: "number_integer", required: false }
    ]
  },
  {
    name: "EZQuest Comparison Group",
    type: "ezquest_comparison_group",
    displayNameKey: "heading",
    fieldDefinitions: [
      { name: "Eyebrow", key: "eyebrow", type: "single_line_text_field", required: false },
      { name: "Heading", key: "heading", type: "single_line_text_field", required: true },
      { name: "Description", key: "description", type: "multi_line_text_field", required: false },
      { name: "Group type", key: "group_type", type: "single_line_text_field", required: false },
      { name: "Products", key: "products", type: "list.product_reference", required: false },
      { name: "CTA label", key: "cta_label", type: "single_line_text_field", required: false },
      { name: "Support note", key: "support_note", type: "multi_line_text_field", required: false }
    ]
  },
  {
    name: "EZQuest FAQ Item",
    type: "ezquest_faq_item",
    displayNameKey: "question",
    fieldDefinitions: [
      { name: "Question", key: "question", type: "single_line_text_field", required: true },
      { name: "Answer", key: "answer", type: "multi_line_text_field", required: true },
      { name: "FAQ group", key: "faq_group", type: "single_line_text_field", required: false },
      { name: "Products", key: "products", type: "list.product_reference", required: false },
      { name: "Collections", key: "collections", type: "list.collection_reference", required: false },
      { name: "Platforms", key: "platforms", type: "list.single_line_text_field", required: false },
      { name: "Related page", key: "related_page", type: "page_reference", required: false },
      { name: "Sort order", key: "sort_order", type: "number_integer", required: false }
    ]
  }
];

const productMetafieldDefinitions = [
  { name: "Technical specification rows", namespace: "ezquest", key: "spec_rows", type: "list.metaobject_reference", ownerType: "PRODUCT", metaobjectDefinitionType: "ezquest_spec_row" },
  { name: "Support summary", namespace: "ezquest", key: "support_summary", type: "rich_text_field", ownerType: "PRODUCT" },
  { name: "Feature highlights", namespace: "ezquest", key: "feature_highlights", type: "list.single_line_text_field", ownerType: "PRODUCT" },
  { name: "Compatibility summary", namespace: "ezquest", key: "compatibility_summary", type: "rich_text_field", ownerType: "PRODUCT" },
  { name: "Linked manuals", namespace: "ezquest", key: "manuals", type: "list.metaobject_reference", ownerType: "PRODUCT", metaobjectDefinitionType: "ezquest_manual" },
  { name: "Linked downloads", namespace: "ezquest", key: "downloads", type: "list.metaobject_reference", ownerType: "PRODUCT", metaobjectDefinitionType: "ezquest_download" },
  { name: "Linked compatibility entries", namespace: "ezquest", key: "compatibility_entries", type: "list.metaobject_reference", ownerType: "PRODUCT", metaobjectDefinitionType: "ezquest_compatibility_entry" },
  { name: "Comparison group", namespace: "ezquest", key: "compare_group", type: "metaobject_reference", ownerType: "PRODUCT", metaobjectDefinitionType: "ezquest_comparison_group" },
  { name: "Linked FAQ items", namespace: "ezquest", key: "faq_items", type: "list.metaobject_reference", ownerType: "PRODUCT", metaobjectDefinitionType: "ezquest_faq_item" }
];

module.exports = {
  metaobjectDefinitions,
  productMetafieldDefinitions
};
