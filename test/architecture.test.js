const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sourceRoot = path.resolve(__dirname, '../src');
const forbiddenDependencies = {
  domain: ['application', 'infrastructure', 'presentation', 'main'],
  application: ['infrastructure', 'presentation', 'main'],
  infrastructure: ['application', 'presentation', 'main'],
  shared: ['domain', 'application', 'infrastructure', 'presentation', 'main'],
};

test('архитектурные слои не нарушают направление зависимостей', () => {
  const violations = [];

  for (const [layer, forbiddenLayers] of Object.entries(forbiddenDependencies)) {
    const layerDirectory = path.join(sourceRoot, layer);
    for (const file of javascriptFiles(layerDirectory)) {
      const content = fs.readFileSync(file, 'utf8');
      const imports = [...content.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]);

      for (const importedPath of imports.filter((value) => value.startsWith('.'))) {
        const resolved = path.resolve(path.dirname(file), importedPath);
        const targetLayer = path.relative(sourceRoot, resolved).split(path.sep)[0];
        if (forbiddenLayers.includes(targetLayer)) {
          violations.push(`${path.relative(sourceRoot, file)} -> ${targetLayer}`);
        }
      }
    }
  }

  assert.deepEqual(violations, []);
});

function javascriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return javascriptFiles(entryPath);
    return entry.name.endsWith('.js') ? [entryPath] : [];
  });
}

