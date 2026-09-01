import { fileStorageImplementation } from '../implementations/fileStorageImplementation';
import { DevServerPlugin } from './types/DevServerPlugin';

// The secure-URL upload/download server standing in for S3.
export const fileStoragePlugin: DevServerPlugin = {
  name: 'file storage http server',
  start: fileStorageImplementation,
};
