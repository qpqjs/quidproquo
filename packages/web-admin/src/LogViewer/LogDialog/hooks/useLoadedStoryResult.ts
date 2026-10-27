import { StoryResult } from 'quidproquo-core';

import { useExternalData, usePlatformDataFromPath } from '../../../components/LoadingBox/hooks';
import { useIsLoading } from '../../../view';
import { getLogUrl } from '../../logic';

export type AsyncStoryState = { logCorrelation: string } & (
  | {
      isLoading: true;
      isLogInColdStorage: boolean;
      log?: null;
    }
  | {
      isLoading: false;
      isLogInColdStorage: true;
      log?: null;
    }
  | {
      isLoading: false;
      isLogInColdStorage: false;
      log: StoryResult<any>;
    }
);

export const useLoadedStoryResult = (logCorrelation: string): AsyncStoryState => {
  const signedRequest = usePlatformDataFromPath<{ url: string; isColdStorage: boolean }>(getLogUrl(logCorrelation));
  const log = useExternalData<StoryResult<any>>(!signedRequest?.isColdStorage ? signedRequest?.url : '');
  const isLoading = useIsLoading();
  const isLogInColdStorage = !!signedRequest?.isColdStorage;

  // Determine the correct return type based on the loading and storage status
  if (isLoading) {
    return { isLoading: true, isLogInColdStorage, logCorrelation };
  } else if (isLogInColdStorage) {
    return { isLoading: false, isLogInColdStorage: true, logCorrelation };
  } else {
    // Fix this, it should be a throw error
    if (!log) {
      return { isLoading: true, isLogInColdStorage, logCorrelation };
    }

    return {
      isLoading: false,
      isLogInColdStorage: false,
      log: log as StoryResult<any>,
      logCorrelation,
    };
  }
};
