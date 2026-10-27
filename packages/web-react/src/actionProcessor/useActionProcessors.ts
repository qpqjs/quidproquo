import { useContext } from 'react';

import { ActionProcessorContext } from './ActionProcessorContext';

export const useActionProcessors = () => useContext(ActionProcessorContext);
