// Multi-lane, TTY-aware progress renderer for the workspace runner. Kept dependency-free
// (just ANSI escapes) to match the hand-rolled style of the rest of scripts/.

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const BAR_WIDTH = 28;

export type ActiveStep = {
  label: string; // e.g. "quidproquo-features@0.1.7 › build:esm"
  startMs: number;
};

export type ProgressState = {
  total: number;
  done: number;
  active: ActiveStep[];
  startMs: number;
};

export const formatElapsed = (ms: number): string => `${(ms / 1000).toFixed(1)}s`;

/** Fixed-width block bar, filled in proportion to `ratio` (0..1). */
export const renderBar = (ratio: number): string => {
  const filled = Math.min(BAR_WIDTH, Math.round(BAR_WIDTH * ratio));
  return '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
};

// Throughput-based ETA: completed steps per ms so far, applied to what's left. Using
// overall throughput (rather than average step time) means the estimate naturally
// reflects how many lanes are running. Needs at least one finished step to have a
// rate, so it reads "ETA --" until then.
const formatEta = (state: ProgressState, now: number): string => {
  if (state.done === 0) {
    return 'ETA --';
  }
  const stepsPerMs = state.done / (now - state.startMs);
  return `ETA ${formatElapsed((state.total - state.done) / stepsPerMs)}`;
};

// Clip to the terminal width so the redraw's cursor-up arithmetic can trust that
// every logical line occupies exactly one terminal row (a wrapped line would break it).
const clip = (line: string, columns: number): string =>
  line.length <= columns ? line : `${line.slice(0, Math.max(0, columns - 1))}…`;

// The redrawable block: a summary bar followed by one line per in-flight step.
// The caller owns cursor movement and clearing so this stays a pure string builder.
export const renderBlock = (state: ProgressState, frame: number, now: number, columns: number): string[] => {
  const ratio = state.total === 0 ? 1 : state.done / state.total;
  const pct = String(Math.round(ratio * 100)).padStart(3);
  const spinner = SPINNER[frame % SPINNER.length];
  const counter = `${state.done}/${state.total}`;
  const header = `${spinner}  [${renderBar(ratio)}] ${pct}%  ${counter}  · ${formatElapsed(now - state.startMs)} · ${formatEta(state, now)}`;

  const lanes = [...state.active]
    .sort((a, b) => a.startMs - b.startMs)
    .map((step) => `   ${spinner} ${step.label} · ${formatElapsed(now - step.startMs)}`);

  return [header, ...lanes].map((line) => clip(line, columns));
};

// Cursor to the start of a previously drawn block of `lines` rows (the caller always
// ends its write with a newline, so the cursor sits on the row just below the block).
export const cursorToBlockStart = (lines: number): string => (lines > 0 ? `\x1b[${lines}F` : '');

export const clearDown = (): string => '\x1b[J';
