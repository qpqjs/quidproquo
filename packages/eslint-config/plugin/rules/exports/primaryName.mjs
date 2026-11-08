/** The export a two-export file is named after: the wrapper, or the effect. */
export const primaryName = (names) => {
  if (names.length === 1) return names[0];
  const [a, b] = names;
  if (b === `${a}Base`) return a;
  if (a === `${b}Base`) return b;
  return names.find((n) => n.endsWith('Effect')) ?? a;
};
