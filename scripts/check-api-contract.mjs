import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const contractRoot = process.env.AC_INTERFACE_ROOT || resolve(process.cwd(), '..', 'AC-interface');
const contractPath = resolve(contractRoot, 'contracts', 'openapi.json');
const sourceTypesPath = resolve(contractRoot, 'contracts', 'generated.ts');
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
const [sourceTypes, localTypes] = await Promise.all([
  readFile(sourceTypesPath, 'utf8'),
  readFile(localTypesPath, 'utf8'),
]);
if (sourceTypes !== localTypes) throw new Error('Generated API types are not synchronized; run contract:sync');
console.log('Generated API types are synchronized');
