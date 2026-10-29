export type ViewsEntry = {
  // The module rspack bundles first (main.ts / main.js).
  entry: string;
  // The html the bundle is served from.
  htmlTemplate: string;
  // True when the package ships no entry and the defaults were written for it.
  isDefault: boolean;
};
