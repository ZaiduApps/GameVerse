import { existsSync } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const CONTRACT_MARKER = ['contracts', 'openapi.json'];

function resolveContractRoot() {
  const override = process.env.AC_INTERFACE_ROOT?.trim();
  if (override) return resolve(override);
  const candidates = [
    resolve(process.cwd(), '..', 'interface'),
    resolve(process.cwd(), '..', 'AC-interface'),
  ];
  const found = candidates.find((candidate) => existsSync(resolve(candidate, ...CONTRACT_MARKER)));
  if (found) return found;
  throw new Error(
    `Cannot locate the interface contracts root. Set AC_INTERFACE_ROOT to the interface repository root, or place it at one of: ${candidates.join(', ')} (each must contain ${CONTRACT_MARKER.join('/')}).`,
  );
}

const contractRoot = resolveContractRoot();
const source = resolve(contractRoot, 'contracts', 'generated.ts');
const targetDir = resolve(process.cwd(), 'src', 'contracts');
await mkdir(targetDir, { recursive: true });
await copyFile(source, resolve(targetDir, 'generated.ts'));
console.log(`Synchronized API types from ${contractRoot}`);
