// Standard union-to-intersection: distributing T into a contravariant (parameter)
// position makes inference produce the intersection of the union's members.
export type UnionToIntersection<T> = (T extends unknown ? (member: T) => void : never) extends (member: infer TIntersection) => void
  ? TIntersection
  : never;
