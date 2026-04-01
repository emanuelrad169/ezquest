#!/usr/bin/env node

const { execFileSync } = require('child_process');

const port = process.env.SHOPIFY_PREVIEW_PORT || '9292';

function findListeners() {
  try {
    const output = execFileSync(
      'lsof',
      ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fpc'],
      { encoding: 'utf8' }
    );

    const listeners = [];
    let current = null;

    output.split('\n').forEach((line) => {
      if (!line) return;
      const type = line[0];
      const value = line.slice(1);

      if (type === 'p') {
        if (current) listeners.push(current);
        current = { pid: Number(value), command: '' };
      } else if (type === 'c' && current) {
        current.command = value;
      }
    });

    if (current) listeners.push(current);
    return listeners;
  } catch (error) {
    return [];
  }
}

function isSafeListener(listener) {
  return ['node', 'ruby', 'shopify'].includes(listener.command);
}

findListeners().forEach((listener) => {
  if (!listener.pid || listener.pid === process.pid) return;

  if (!isSafeListener(listener)) {
    console.error(`Port ${port} is already in use by ${listener.command} (pid ${listener.pid}).`);
    process.exit(1);
  }

  try {
    process.kill(listener.pid, 'SIGTERM');
  } catch (error) {
    console.error(`Unable to release port ${port} from pid ${listener.pid}.`);
    process.exit(1);
  }
});
