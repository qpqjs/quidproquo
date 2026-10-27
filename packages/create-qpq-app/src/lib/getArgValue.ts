// Value of a flag over the command's argv, supporting both `--flag value`
// and `--flag=value` forms.
export const getArgValue = (argv: string[], flag: string): string | undefined => {
  const eq = argv.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(`${flag}=`.length);
  const idx = argv.indexOf(flag);
  return idx >= 0 ? argv[idx + 1] : undefined;
};
