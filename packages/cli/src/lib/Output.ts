type Print = (...parts: unknown[]) => void;

/** The prefixed console every cli command prints through. */
export type Output = {
  log: Print;
  info: Print;
  warn: Print;
  error: Print;
  // A named stopwatch, printed on end.
  time: (label: string) => void;
  timeEnd: (label: string) => void;
  // Rewrites a line printed `linesUp` rows above the cursor in place (a status chip appended to a row that is
  // already on screen), prefixed like every other line. Terminal only: the caller falls back to a plain line otherwise.
  rewriteLineAbove: (linesUp: number, text: string) => void;
};
