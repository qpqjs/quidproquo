import { QpqExecutionTrace, QpqExecutionTraceValue } from 'quidproquo-core';

// Per-line rollup of a trace for one source file: how many times the line executed, and
// which locals changed as a result of executing it.
export interface TraceLineAnnotation {
  visitCount: number;

  // Preview strings of values PRODUCED by executing this line, last visit wins. A
  // statement's effect shows up in the locals of the NEXT step, so each step's diff
  // against its successor (same function and source only) is attributed back to the
  // step's own line.
  changes: Record<string, string>;

  // Preview of the value returned at this line (return break positions), last visit wins
  returned?: string;
}

// Change detection compares the deepest capture available — previews can collide
// (nested objects render as 'Object') where the json still differs.
const valueIdentity = (value: QpqExecutionTraceValue | undefined): string | undefined =>
  value === undefined ? undefined : (value.json ?? value.preview);

// 1-based line -> annotation
export const buildLineAnnotations = (trace: QpqExecutionTrace, sourceIndex: number): Map<number, TraceLineAnnotation> => {
  const annotations = new Map<number, TraceLineAnnotation>();

  for (let stepIndex = 0; stepIndex < trace.steps.length; stepIndex += 1) {
    const step = trace.steps[stepIndex];
    if (step.sourceIndex !== sourceIndex) {
      continue;
    }

    const annotation = annotations.get(step.line) || { visitCount: 0, changes: {} };
    annotation.visitCount += 1;

    if (step.returnValue) {
      annotation.returned = step.returnValue.preview;
    }

    const nextStep = trace.steps[stepIndex + 1];
    if (nextStep && nextStep.sourceIndex === step.sourceIndex && nextStep.functionName === step.functionName) {
      for (const [name, value] of Object.entries(nextStep.locals)) {
        if (valueIdentity(step.locals[name]) !== valueIdentity(value)) {
          annotation.changes[name] = value.preview;
        }
      }
    }

    annotations.set(step.line, annotation);
  }

  return annotations;
};

export const formatLineAnnotation = (annotation: TraceLineAnnotation, maxEntries: number = 4): string => {
  const visits = annotation.visitCount > 1 ? `×${annotation.visitCount} ` : '';

  const changeEntries = Object.entries(annotation.changes);
  const shown = changeEntries
    .slice(0, maxEntries)
    .map(([name, value]) => `${name} = ${value}`)
    .join(', ');
  const overflow = changeEntries.length > maxEntries ? ', …' : '';

  const returned = annotation.returned !== undefined ? `${shown ? ', ' : ''}→ ${annotation.returned}` : '';

  return `${visits}${shown}${overflow}${returned}`.trim();
};

// Bundle paths are huge (file:///tmp/qpq-federated-code/<container>/<hash>/<chunk>.js)
// and share their prefix — trim the common directory prefix so the distinguishing tail
// is what gets displayed. Single source: just the basename.
export const getDisplaySourceNames = (paths: string[]): string[] => {
  if (paths.length === 0) {
    return [];
  }
  if (paths.length === 1) {
    return [paths[0].split('/').pop() || paths[0]];
  }

  let prefix = paths[0];
  for (const path of paths) {
    while (prefix && !path.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
  }

  // Cut at a directory boundary so we never split a name in half
  const cutAt = prefix.lastIndexOf('/') + 1;
  return paths.map((path) => path.slice(cutAt) || path);
};

// One step whose captured values matched a search, with the locals that matched —
// RETURNS_MATCH_NAME stands in for a matching return value.
export interface TraceValueMatch {
  stepIndex: number;
  matchedNames: string[];
}

export const RETURNS_MATCH_NAME = '→ returns';

// Case-insensitive substring search across every captured value of the given steps —
// variable names, preview strings, and the deep json captures (values a preview clamps
// or nests can still be found). stepIndexes ordered → matches come back ordered, so the
// FIRST match is where a generated value first appears in the execution.
export const searchStepValues = (trace: QpqExecutionTrace, query: string, stepIndexes: number[]): TraceValueMatch[] => {
  const loweredQuery = query.toLowerCase();
  if (!loweredQuery) {
    return [];
  }

  const valueMatches = (value: QpqExecutionTraceValue): boolean =>
    value.preview.toLowerCase().includes(loweredQuery) || (value.json !== undefined && value.json.toLowerCase().includes(loweredQuery));

  const matches: TraceValueMatch[] = [];
  for (const stepIndex of stepIndexes) {
    const step = trace.steps[stepIndex];

    const matchedNames = Object.entries(step.locals)
      .filter(([name, value]) => name.toLowerCase().includes(loweredQuery) || valueMatches(value))
      .map(([name]) => name);

    if (step.returnValue && valueMatches(step.returnValue)) {
      matchedNames.push(RETURNS_MATCH_NAME);
    }

    if (matchedNames.length > 0) {
      matches.push({ stepIndex, matchedNames });
    }
  }

  return matches;
};

// "Your code" vs framework/dependency code, the same way devtools ignore-listing draws
// the line: anything that resolved into node_modules is external. Unmapped generated
// chunks (no node_modules in a file:///tmp/... url) stay visible — they mix user and
// framework code and hiding them would hide user statements.
export const isExternalSourcePath = (path: string): boolean => path.includes('node_modules');

// The source most of the trace ran in — the sensible tab to open first.
export const getDefaultSourceIndex = (trace: QpqExecutionTrace): number => {
  const stepCounts = new Map<number, number>();
  for (const step of trace.steps) {
    stepCounts.set(step.sourceIndex, (stepCounts.get(step.sourceIndex) || 0) + 1);
  }

  let bestSourceIndex = 0;
  let bestCount = -1;
  for (const [sourceIndex, count] of stepCounts) {
    if (count > bestCount) {
      bestSourceIndex = sourceIndex;
      bestCount = count;
    }
  }

  return bestSourceIndex;
};
