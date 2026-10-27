// Required config with all fields filled by the dev server
export interface FileStorageConfig {
  storagePath: string;
  secureUrlPort: number;
  // The port in generated urls; differs from secureUrlPort when a host maps the listener elsewhere.
  secureUrlPublicPort: number;
  secureUrlHost: string;
  secureUrlSecret: string;
}
