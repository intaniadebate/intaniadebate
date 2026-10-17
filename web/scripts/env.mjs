import fs from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';
export function loadLocalEnv(root) {
  for (const name of ['.env.local', '.env']) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    const values = parseEnv(fs.readFileSync(file, 'utf8'));
    for (const [key, value] of Object.entries(values)) if (!(key in process.env)) process.env[key] = value;
  }
}
