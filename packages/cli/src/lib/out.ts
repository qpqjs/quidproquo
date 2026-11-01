type Print = (...parts: unknown[]) => void;

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

// Every line the cli prints carries `[qpq:<area>]`, so output from the concurrent and nested
// commands reads as one program. This is the only place the cli touches the console.
export const createOutput = (area: string): Output => {
  const prefix = `[qpq:${area}]`;

  // Every line of a leading string gets the prefix, and a blank line stays blank, so a message with leading or
  // embedded newlines reads as prefixed lines rather than a lone prefix followed by bare text.
  const prefixLines = (text: string): string =>
    text
      .split('\n')
      .map((line) => (line === '' ? '' : `${prefix} ${line}`))
      .join('\n');

  // A leading string is prefixed line by line; anything else (an error, an object) is printed
  // after the prefix as its own argument so the console keeps formatting it. The console method is
  // looked up per call, not captured, so a test can spy on it after this module loads.
  const withPrefix = (method: 'log' | 'info' | 'warn' | 'error'): Print => {
    return (...parts) => {
      const [first, ...rest] = parts;

      if (typeof first === 'string') {
        return console[method](prefixLines(first), ...rest);
      }

      return console[method](prefix, ...parts);
    };
  };

  return {
    log: withPrefix('log'),
    info: withPrefix('info'),
    warn: withPrefix('warn'),
    error: withPrefix('error'),
    time: (label) => console.time(`${prefix} ${label}`),
    timeEnd: (label) => console.timeEnd(`${prefix} ${label}`),
    rewriteLineAbove: (linesUp, text) => {
      process.stdout.write(`\x1b[${linesUp}F\x1b[2K${prefixLines(text)}\x1b[${linesUp}E`);
    },
  };
};
