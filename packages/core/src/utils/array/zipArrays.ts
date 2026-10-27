export const zipArrays = <TLeft, TRight>(left: readonly TLeft[], right: readonly TRight[]): [TLeft | undefined, TRight | undefined][] => {
  const maxLength = Math.max(left.length, right.length);
  return Array.from({ length: maxLength }, (_, i) => [left[i], right[i]]);
};
