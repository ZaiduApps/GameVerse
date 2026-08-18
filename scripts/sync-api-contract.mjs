import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const contractRoot = process.env.AC_INTERFACE_ROOT || resolve(process.cwd(), '..', 'AC-interface');
const source = resolve(contractRoot, 'contracts', 'generated.ts');
const targetDir = resolve(process.cwd(), 'src', 'contracts');
await mkdir(targetDir, { recursive: true });
await copyFile(source, resolve(targetDir, 'generated.ts'));
console.log('Synchronized API types from AC-interface');
