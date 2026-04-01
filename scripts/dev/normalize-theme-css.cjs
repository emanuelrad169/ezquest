const fs = require('fs');
const path = require('path');
const postcss = require(path.resolve(process.cwd(), 'node_modules/postcss'));

const filePath = path.resolve(process.cwd(), 'src/styles/theme.css');
const css = fs.readFileSync(filePath, 'utf8');
const root = postcss.parse(css);

const screenPrefixes = new Set(['sm', 'md', 'lg', 'xl', '2xl']);

function tokenizeApply(params) {
  const tokens = [];
  let current = '';
  let depth = 0;

  for (const char of params) {
    if (char === '[') depth += 1;
    if (char === ']') depth -= 1;

    if (/\s/.test(char) && depth === 0) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) tokens.push(current);
  return tokens;
}

function splitPrefixes(token) {
  const parts = [];
  let current = '';
  let depth = 0;

  for (const char of token) {
    if (char === '[') depth += 1;
    if (char === ']') depth -= 1;

    if (char === ':' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  parts.push(current);
  return { prefixes: parts.slice(0, -1), base: parts[parts.length - 1] };
}

function decodeValue(value) {
  return value.replace(/_/g, ' ');
}

function declarationsFor(base) {
  const match = base.match(/^([a-z-]+)-\[(.+)\]$/);
  if (!match) return null;

  const utility = match[1];
  const value = decodeValue(match[2]);

  switch (utility) {
    case 'max-w':
      return [{ prop: 'max-width', value }];
    case 'min-w':
      return [{ prop: 'min-width', value }];
    case 'w':
      return [{ prop: 'width', value }];
    case 'h':
      return [{ prop: 'height', value }];
    case 'min-h':
      return [{ prop: 'min-height', value }];
    case 'rounded':
      return [{ prop: 'border-radius', value }];
    case 'tracking':
      return [{ prop: 'letter-spacing', value }];
    case 'leading':
      return [{ prop: 'line-height', value }];
    case 'text':
      return [{ prop: 'font-size', value }];
    case 'shadow':
      return [{ prop: 'box-shadow', value }];
    case 'aspect':
      return [{ prop: 'aspect-ratio', value: value.replace('/', ' / ') }];
    case 'z':
      return [{ prop: 'z-index', value }];
    case 'grid-cols':
      return [{ prop: 'grid-template-columns', value }];
    case 'bg':
      return [{ prop: /gradient\(|url\(/.test(value) ? 'background-image' : 'background-color', value }];
    case 'top':
      return [{ prop: 'top', value }];
    case 'right':
      return [{ prop: 'right', value }];
    case 'bottom':
      return [{ prop: 'bottom', value }];
    case 'left':
      return [{ prop: 'left', value }];
    case 'backdrop-blur':
      return [
        { prop: '-webkit-backdrop-filter', value: `blur(${value})` },
        { prop: 'backdrop-filter', value: `blur(${value})` }
      ];
    case 'scale':
      return [{ prop: 'transform', value: `scale(${value})` }];
    default:
      return null;
  }
}

function buildVariantSelector(selector, prefixes) {
  let output = selector;

  for (const prefix of prefixes) {
    if (prefix === 'hover') {
      output = output
        .split(',')
        .map((part) => `${part.trim()}:hover`)
        .join(', ');
    } else if (prefix === 'focus') {
      output = output
        .split(',')
        .map((part) => `${part.trim()}:focus`)
        .join(', ');
    } else if (prefix === 'group-hover') {
      output = output
        .split(',')
        .map((part) => `.group:hover ${part.trim()}`)
        .join(', ');
    }
  }

  return output;
}

root.walkAtRules('apply', (atRule) => {
  const parent = atRule.parent;
  if (!parent || parent.type !== 'rule') return;

  const tokens = tokenizeApply(atRule.params);
  const keep = [];
  const baseDeclarations = [];
  const variantBuckets = new Map();
  const insertionPoint = atRule;

  for (const token of tokens) {
    if (!token.includes('[')) {
      keep.push(token);
      continue;
    }

    const { prefixes, base } = splitPrefixes(token);
    const declarations = declarationsFor(base);

    if (!declarations) {
      keep.push(token);
      continue;
    }

    const screen = prefixes.find((prefix) => screenPrefixes.has(prefix)) || null;
    const behavior = prefixes.filter((prefix) => !screenPrefixes.has(prefix));

    if (!screen && behavior.length === 0) {
      baseDeclarations.push(...declarations);
      continue;
    }

    const bucketKey = `${screen || 'base'}|${behavior.join(':')}`;
    if (!variantBuckets.has(bucketKey)) {
      variantBuckets.set(bucketKey, { screen, behavior, declarations: [] });
    }

    variantBuckets.get(bucketKey).declarations.push(...declarations);
  }

  for (const declaration of baseDeclarations.reverse()) {
    insertionPoint.after(postcss.decl(declaration));
  }

  for (const bucket of Array.from(variantBuckets.values()).reverse()) {
    const variantRule = postcss.rule({
      selector: buildVariantSelector(parent.selector, bucket.behavior)
    });

    for (const declaration of bucket.declarations) {
      variantRule.append(postcss.decl(declaration));
    }

    if (bucket.screen) {
      const screenRule = postcss.atRule({ name: 'screen', params: bucket.screen });
      screenRule.append(variantRule);
      parent.after(screenRule);
    } else {
      parent.after(variantRule);
    }
  }

  if (keep.length > 0) {
    atRule.params = keep.join(' ');
  } else {
    atRule.remove();
  }
});

fs.writeFileSync(filePath, `${root.toString()}\n`);
