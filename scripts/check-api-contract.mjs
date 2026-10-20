import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

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
const contractPath = resolve(contractRoot, ...CONTRACT_MARKER);
const sourceVersionPath = resolve(contractRoot, 'contracts', 'contract-version.json');
const localTypesPath = resolve(process.cwd(), 'src', 'contracts', 'generated.ts');
const document = JSON.parse(await readFile(contractPath, 'utf8'));
const contractVersion = JSON.parse(await readFile(sourceVersionPath, 'utf8'));
const paths = Object.keys(document.paths || {});
if (!String(document.openapi || '').startsWith('3.') || paths.length === 0) {
  throw new Error(`Invalid API contract: ${contractPath}`);
}
if (document['x-contract-version'] !== contractVersion.version) {
  throw new Error('OpenAPI contract version is not synchronized with contract-version.json');
}
console.log(`API contract available: ${document.info?.title || 'unknown'} ${document.info?.version || 'unknown'} (${paths.length} paths)`);
const localTypes = await readFile(localTypesPath, 'utf8');
const expectedHash = createHash('sha256').update(await readFile(contractPath)).digest('hex');
const localHash = localTypes.match(/@contract-sha256\s+([a-f0-9]{64})/)?.[1];
if (localHash !== expectedHash) throw new Error('Generated API types are not synchronized; run contract:sync');
console.log('Generated API types are synchronized');
