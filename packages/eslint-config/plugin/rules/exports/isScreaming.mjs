export const isScreaming = (name) => /^[A-Z][A-Z0-9_]*$/.test(name) && name.length > 1;
