import path from 'node:path';

// Files the one-export and filename rules never look at: barrels, declarations and tests.
export const isExemptFile = (filename) => {
  const base = path.basename(filename);
  return /^index\.tsx?$/.test(base) || base.endsWith('.d.ts') || /\.(test|spec)\.[jt]sx?$/.test(base);
};

const declaredNames = (declaration) => {
  if (!declaration) return [];
  if (declaration.type === 'VariableDeclaration') {
    return declaration.declarations.filter((d) => d.id.type === 'Identifier').map((d) => d.id.name);
  }
  return declaration.id ? [declaration.id.name] : [];
};

/** Every exported name of a module, in source order, de-duplicated (a type and a value may share one). */
export const collectExports = (program) => {
  const names = [];
  for (const node of program.body) {
    let found = [];
    if (node.type === 'ExportNamedDeclaration') {
      found = node.declaration ? declaredNames(node.declaration) : node.specifiers.map((s) => s.exported.name ?? s.exported.value);
    } else if (node.type === 'ExportDefaultDeclaration') {
      found = ['default'];
    } else if (node.type === 'ExportAllDeclaration') {
      found = [node.exported ? node.exported.name : '*'];
    }
    for (const name of found) {
      if (!names.some((n) => n.name === name)) names.push({ name, node });
    }
  }
  return names;
};

// Two exports that are one concept (G1): a base requester and its generic wrapper, or an
// effect type and its payload type.
export const isAllowedPair = (a, b) => {
  const [x, y] = [a, b].sort((p, q) => p.length - q.length);
  if (y === `${x}Base`) return true;
  const stem = (n, suffix) => (n.endsWith(suffix) ? n.slice(0, -suffix.length) : null);
  const effect = stem(a, 'Effect') ?? stem(b, 'Effect');
  const payload = stem(a, 'Payload') ?? stem(b, 'Payload');
  return effect !== null && payload !== null && effect === payload;
};

/** The export a two-export file is named after: the wrapper, or the effect. */
export const primaryName = (names) => {
  if (names.length === 1) return names[0];
  const [a, b] = names;
  if (b === `${a}Base`) return a;
  if (a === `${b}Base`) return b;
  return names.find((n) => n.endsWith('Effect')) ?? a;
};

/** SCREAMING_SNAKE to camelCase, so `MAX_ITEMS` lives in `maxItems.ts` (G8). */
export const screamingToCamel = (name) =>
  name
    .toLowerCase()
    .split('_')
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');

export const isScreaming = (name) => /^[A-Z][A-Z0-9_]*$/.test(name) && name.length > 1;
