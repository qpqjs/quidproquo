/* eslint-disable no-console */
type Print = (...parts: unknown[]) => void;

export type Output = {
  log: Print;
  info: Print;
  warn: Print;
  error: Print;
  // A named stopwatch, printed on end.
  time: (label: string) => void;
  timeEnd: (label: string) => void;
};

// Every line the cli prints carries `[qpq:<area>]`, so output from the concurrent and nested
// commands reads as one program. This is the only place the cli touches the console.
export const createOutput = (area: string): Output => {
  const prefix = `[qpq:${area}]`;

  // A leading string is joined onto the prefix; anything else (an error, an object) is printed
  // after it as its own argument so the console keeps formatting it. The console method is
  // looked up per call, not captured, so a test can spy on it after this module loads.
  const withPrefix = (method: 'log' | 'info' | 'warn' | 'error'): Print => {
    return (...parts) => {
      const [first, ...rest] = parts;

      if (typeof first === 'string') {
        return console[method](`${prefix} ${first}`, ...rest);
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
  };
};
