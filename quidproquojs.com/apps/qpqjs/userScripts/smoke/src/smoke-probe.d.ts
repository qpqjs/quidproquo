// The probe module the test service hands this script (defineUserScriptModule in the
// userScript smoke suite). Declared by hand: the suite's own types are not reachable from here.
declare module 'smoke-probe' {
  export const probeAws: (bucket: string, key: string) => Promise<unknown>;
}
