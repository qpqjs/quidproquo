import { createContextReader } from '../../context/createContextReader';
import { storageScopeContext } from './storageScopeContext';

export const askStorageScopeRead = createContextReader(storageScopeContext);
