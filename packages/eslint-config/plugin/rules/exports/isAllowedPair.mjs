// Two exports that are one concept (G1): a base requester and its generic wrapper, or an
// effect type and its payload type.
export const isAllowedPair = (a, b) => {
  const [x, y] = [a, b].sort((p, q) => p.length - q.length);
  if (y === `${x}Base`) return true;
  const stem = (n, suffix) => (n.endsWith(suffix) ? n.slice(0, -suffix.length) : null);
  const effect = stem(a, 'Effect') ?? stem(b, 'Effect');
  const payload = stem(a, 'Payload') ?? stem(b, 'Payload');
  return effect !== null && payload !== null && effect === payload;
};
