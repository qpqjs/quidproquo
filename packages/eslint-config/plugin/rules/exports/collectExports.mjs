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
