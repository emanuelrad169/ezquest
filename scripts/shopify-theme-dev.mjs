import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const cwd = process.cwd();

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const contents = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);

    if (!match) {
      continue;
    }

    let [, key, value] = match;
    value = value.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

const envFromFiles = {
  ...readEnvFile(path.join(cwd, '.env')),
  ...readEnvFile(path.join(cwd, '.env.local')),
};

const store = process.env.SHOPIFY_FLAG_STORE || envFromFiles.SHOPIFY_FLAG_STORE;

if (!store) {
  console.error('A Shopify store is required to run local theme development.\n');
  console.error('Set `SHOPIFY_FLAG_STORE` in `.env.local` or pass it inline.\n');
  console.error('Examples:');
  console.error('  cp .env.example .env.local');
  console.error('  SHOPIFY_FLAG_STORE=your-store.myshopify.com npm run dev');
  process.exit(1);
}

const child = spawn('shopify', ['theme', 'dev', `--store=${store}`], {
  cwd,
  env: {
    ...process.env,
    ...envFromFiles,
    SHOPIFY_FLAG_STORE: store,
  },
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
