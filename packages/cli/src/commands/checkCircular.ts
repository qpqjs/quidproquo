// `qpq check:circular` — scan every workspace's src for circular imports (the
// class of bug that TDZ-crashes ESM bundles and silently drops exports under
// CJS). Cycles fail the command (exit 1) — they are never acceptable; --warn or
// QPQ_CIRCULAR_DEPS_WARN=1 is a temporary escape hatch that reports without
// failing while fixing.
import { findWorkspaceImportCycles, ImportCycle } from '../lib/circularImports';
import { getRoot } from '../lib/discovery';

type CycleGroup = { files: string[]; chainCount: number };

// madge reports every distinct loop path; one tangled module can produce dozens
// of chains through the same files. Merge chains that share any file into one
// group so the report shows each tangle once, with its full blast radius.
const groupCycles = (cycles: ImportCycle[]): CycleGroup[] => {
  const parent = new Map<string, string>();

  const find = (file: string): string => {
    const found = parent.get(file) ?? file;
    if (found === file) {
      return file;
    }
    const rootFile = find(found);
    parent.set(file, rootFile);
    return rootFile;
  };

  for (const cycle of cycles) {
    for (const file of cycle) {
      parent.set(find(file), find(cycle[0]));
    }
  }

  const groups = new Map<string, CycleGroup>();
  for (const cycle of cycles) {
    const key = find(cycle[0]);
    const group = groups.get(key) ?? { files: [], chainCount: 0 };
    group.chainCount += 1;
    group.files = [...new Set([...group.files, ...cycle])];
    groups.set(key, group);
  }

  return [...groups.values()];
};

export const checkCircularCommand = async (argv: string[]): Promise<void> => {
  const warnOnly = argv.includes('--warn') || !!process.env.QPQ_CIRCULAR_DEPS_WARN;

  const cycles = await findWorkspaceImportCycles(getRoot());

  if (cycles.length === 0) {
    console.log('check:circular: no circular imports found');
    return;
  }

  const groups = groupCycles(cycles);

  const colour = warnOnly ? '\x1b[33m' : '\x1b[31m';
  for (const group of groups) {
    const chainNote = group.chainCount > 1 ? `, ${group.chainCount} distinct loops` : '';
    console.warn(`${colour}Circular imports (${group.files.length} files${chainNote}):\n    ${group.files.join('\n    ')}\x1b[0m`);
  }
  console.warn(`${colour}check:circular: ${groups.length} circular import group(s) found (${cycles.length} loops)\x1b[0m`);

  if (!warnOnly) {
    process.exitCode = 1;
  }
};
