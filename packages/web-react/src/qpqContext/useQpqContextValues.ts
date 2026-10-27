import { QpqContext } from '@qpqjs/core';

import { useContext } from 'react';

import { qpqReactContext } from './qpqReactContext';

export const useQpqContextValues = (): QpqContext<any> => {
  return useContext(qpqReactContext);
};
