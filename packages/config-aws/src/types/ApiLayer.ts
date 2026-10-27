export interface ApiLayer {
  buildPath?: string;
  name: string;
  layerArn?: string;

  // npm packages this layer provides at runtime — bundlers externalize them
  // on AWS builds; local runtimes resolve them from node_modules as normal.
  modules?: string[];
}
