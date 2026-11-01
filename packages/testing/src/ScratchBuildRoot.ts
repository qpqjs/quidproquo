/** A throwaway config root for a synth test, with the folders a lambda asset needs and a way to delete it all. */
export type ScratchBuildRoot = {
  // Pass as `configRoot` to buildTestQpqConfig; the built handlers sit under `build/` inside it.
  configRoot: string;
  // An empty folder standing in for the log extension layer the aws package build produces.
  extensionLayerPath: string;
  remove: () => void;
};
