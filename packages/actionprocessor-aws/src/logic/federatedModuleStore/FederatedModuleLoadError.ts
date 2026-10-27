// Discriminable failures raised inside loadFederatedStory. All of them are ultimately
// caught there and turned into a fall-back-to-bundled (with a warning) - they exist so
// logs/backoff can tell WHY a store didn't load, not to crash the request.
export enum FederatedModuleLoadErrorCode {
  // Store URL wasn't s3:// or file:// (a config/env mistake).
  unsupportedStoreUrl = 'unsupportedStoreUrl',
  // manifest.json parsed but is missing required fields (bad/partial publish).
  manifestInvalid = 'manifestInvalid',
  // A version's files downloaded but the entry didn't expose a valid MF container.
  containerLoadFailed = 'containerLoadFailed',
  // The manifest exposed the module, but it didn't export the requested story name
  // (e.g. a story was renamed in the remote but the manifest still lists it).
  storyNotExported = 'storyNotExported',
}

export class FederatedModuleLoadError extends Error {
  constructor(
    public readonly code: FederatedModuleLoadErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'FederatedModuleLoadError';
  }
}
