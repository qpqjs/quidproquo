import { createContextProvider } from '../../context/createContextProvider';
import { storageScopeContext } from './storageScopeContext';

export const askStorageScopeProvide = createContextProvider(storageScopeContext, (scope: string) => scope);
