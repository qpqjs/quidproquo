export function when<T, F = undefined>(condition: unknown, value: T, fallback?: F): T | F {
  return condition ? value : (fallback as F);
}
