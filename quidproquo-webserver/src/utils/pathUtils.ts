export const urlPathLength = (path: string) => {
  return path.replace(/\{[^}]+\}/g, '').length;
};

interface PathObject {
  path: string;
}

// Most specific first: the longest static (param-stripped) path wins, so `/packs/build` is tried
// before `/packs/{id}` and a literal segment is never swallowed by a sibling's parameter. The matcher
// takes the first match in this order.
export const sortPathMatchConfigs = <T extends PathObject>(objects: T[]): T[] => {
  return [...objects].sort((a, b) => {
    return urlPathLength(b.path) - urlPathLength(a.path);
  });
};
