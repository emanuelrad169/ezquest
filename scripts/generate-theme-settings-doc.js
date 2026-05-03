const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sectionsDir = path.join(root, 'sections');
const outPath = path.join(root, 'docs', 'theme-settings.md');

function readJsonSchema(file) {
  const source = fs.readFileSync(file, 'utf8');
  const match = source.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]);
  } catch (error) {
    return { error: error.message };
  }
}

function describeSetting(setting) {
  const pieces = [];
  if (setting.label) pieces.push(setting.label);
  if (setting.info) pieces.push(setting.info);
  if (setting.default !== undefined && setting.default !== '') {
    pieces.push(`Default: ${JSON.stringify(setting.default)}`);
  }
  if (Array.isArray(setting.options) && setting.options.length) {
    const options = setting.options
      .map((option) => option.label || option.value)
      .filter(Boolean)
      .join(', ');
    if (options) pieces.push(`Options: ${options}`);
  }
  return pieces.join(' ');
}

function settingRows(settings = []) {
  return settings
    .filter((setting) => setting.type !== 'header' && setting.type !== 'paragraph')
    .map((setting) => {
      const id = setting.id || setting.type || 'unnamed';
      return `| \`${id}\` | \`${setting.type}\` | ${describeSetting(setting).replace(/\|/g, '\\|') || '-'} |`;
    });
}

const sectionFiles = fs.readdirSync(sectionsDir)
  .filter((file) => file.endsWith('.liquid'))
  .sort();

const lines = [
  '# EZQuest Theme Settings',
  '',
  `Generated: ${new Date().toISOString().slice(0, 10)}`,
  '',
  'This reference is generated from the `{% schema %}` blocks in `sections/*.liquid` so the client can see what each Customizer section exposes.',
  '',
];

for (const file of sectionFiles) {
  const fullPath = path.join(sectionsDir, file);
  const schema = readJsonSchema(fullPath);
  if (!schema) continue;

  lines.push(`## ${schema.name || file.replace(/\.liquid$/, '')}`);
  lines.push('');
  lines.push(`File: \`sections/${file}\``);
  lines.push('');

  if (schema.error) {
    lines.push(`Schema parse error: ${schema.error}`);
    lines.push('');
    continue;
  }

  const rows = settingRows(schema.settings);
  if (rows.length) {
    lines.push('| Setting | Type | Description |');
    lines.push('|---|---|---|');
    lines.push(...rows);
    lines.push('');
  } else {
    lines.push('No section-level settings.');
    lines.push('');
  }

  if (Array.isArray(schema.blocks) && schema.blocks.length) {
    lines.push('### Blocks');
    lines.push('');
    for (const block of schema.blocks) {
      lines.push(`#### ${block.name || block.type}`);
      lines.push('');
      lines.push(`Type: \`${block.type}\``);
      lines.push('');
      const blockRows = settingRows(block.settings);
      if (blockRows.length) {
        lines.push('| Setting | Type | Description |');
        lines.push('|---|---|---|');
        lines.push(...blockRows);
      } else {
        lines.push('No block settings.');
      }
      lines.push('');
    }
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${lines.join('\n').trim()}\n`);
console.log(`Generated ${path.relative(root, outPath)} from ${sectionFiles.length} section files.`);
