// Positional args = non-flag args, skipping values consumed by known flags.
export const getPositionalArgs = (argv: string[], valueFlags: string[]): string[] =>
  argv.filter((arg, index) => {
    if (arg.startsWith('--')) return false;
    const previous = argv[index - 1];
    return !(previous && valueFlags.includes(previous));
  });
