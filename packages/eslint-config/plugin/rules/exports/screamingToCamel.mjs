/** SCREAMING_SNAKE to camelCase, so `MAX_ITEMS` lives in `maxItems.ts` (G8). */
export const screamingToCamel = (name) =>
  name
    .toLowerCase()
    .split('_')
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
