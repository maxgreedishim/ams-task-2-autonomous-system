import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const layers = ['shared', 'entities', 'features', 'widgets', '_pages', '_app'];
const layerRank = new Map(layers.map((layer, index) => [layer, index]));
const errors = [];

function filesIn(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : /\.(ts|tsx|js|jsx|mjs)$/.test(entry.name) ? [file] : [];
  });
}

function layerOf(file) {
  const relative = path.relative(root, file).split(path.sep);
  return relative[0];
}

function targetOf(source, specifier) {
  if (specifier.startsWith('@/')) return path.join(root, specifier.slice(2));
  if (specifier.startsWith('.')) return path.resolve(path.dirname(source), specifier);
  return null;
}

function resolveFile(candidate) {
  const options = [candidate, `${candidate}.ts`, `${candidate}.tsx`, `${candidate}.js`, `${candidate}.mjs`, path.join(candidate, 'index.ts'), path.join(candidate, 'index.tsx')];
  return options.find((file) => fs.existsSync(file) && fs.statSync(file).isFile());
}

for (const layer of layers) {
  const directory = path.join(root, layer);
  if (!fs.existsSync(directory)) errors.push(`missing layer: ${layer}`);
}

for (const file of filesIn(root)) {
  const sourceLayer = layerOf(file);
  if (!layerRank.has(sourceLayer)) {
    errors.push(`${path.relative(process.cwd(), file)} is outside the allowed FSD layers`);
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  const importPattern = /(?:import|export)\s+(?:[^'"`]*?\s+from\s+)?['"`]([^'"`]+)['"`]/g;
  for (const match of text.matchAll(importPattern)) {
    const specifier = match[1];
    const target = targetOf(file, specifier);
    if (!target) continue;
    const resolved = resolveFile(target);
    if (!resolved) {
      errors.push(`${path.relative(process.cwd(), file)} imports missing module ${specifier}`);
      continue;
    }
    const targetLayer = layerOf(resolved);
    if (!layerRank.has(targetLayer)) continue;
    if (sourceLayer !== targetLayer && specifier.startsWith('.')) {
      errors.push(`${path.relative(process.cwd(), file)} must use an alias for cross-layer import ${specifier}`);
    }
    if (layerRank.get(sourceLayer) < layerRank.get(targetLayer)) {
      errors.push(`${path.relative(process.cwd(), file)} imports upward from ${sourceLayer} to ${targetLayer}`);
    }
    const sourceParts = path.relative(root, file).split(path.sep);
    const targetParts = path.relative(root, resolved).split(path.sep);
    const crossSlice = !['shared', 'app'].includes(sourceLayer) && sourceLayer === targetLayer && sourceParts[1] && targetParts[1] && sourceParts[1] !== targetParts[1];
    const publicImport = specifier.startsWith('@/') && targetParts.length === 3 && targetParts[2].startsWith('index.');
    if (crossSlice && !publicImport) {
      errors.push(`${path.relative(process.cwd(), file)} uses deep cross-slice import ${specifier}`);
    }
    if (specifier.startsWith('@/') && targetLayer !== 'shared' && targetParts.length > 2 && !publicImport) {
      errors.push(`${path.relative(process.cwd(), file)} must import ${targetLayer}/${targetParts[1]} through its public API`);
    }
  }
}

for (const layer of layers.filter((item) => !['shared', 'app'].includes(item))) {
  for (const slice of fs.readdirSync(path.join(root, layer), { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
    if (!fs.existsSync(path.join(root, layer, slice.name, 'index.ts')) && !fs.existsSync(path.join(root, layer, slice.name, 'index.tsx'))) {
      errors.push(`missing public API: ${layer}/${slice.name}/index.ts`);
    }
  }
}

if (errors.length > 0) {
  console.error(`FSD check failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`FSD check passed: ${layers.join(' -> ')}`);
