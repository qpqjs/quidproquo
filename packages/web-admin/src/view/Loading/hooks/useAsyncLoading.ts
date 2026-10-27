import { useFastCallback } from 'quidproquo-web-react';

import { AnyAsyncFunction } from '../../types';
import { useLoadingApi } from './useLoadingApi';

/**
 * Custom hook that wraps an asynchronous function with loading triggers.
 *
 * @template T - An array of argument types for the callback function.
 * @template U - The return type of the callback function.
 * @param {AnyAsyncFunction<T, U>} callback - The asynchronous function to be wrapped.
 * @returns {AnyAsyncFunction<T, U>} - The wrapped asynchronous function with loading triggers.
 */
export function useAsyncLoading<T extends any[], U>(callback: AnyAsyncFunction<T, U>): AnyAsyncFunction<T, U> {
  const { addLoading, removeLoading } = useLoadingApi();

  /**
   * The wrapped asynchronous function that adds and removes loading triggers around the original callback.
   *
   * @param {...T} args - Arguments to be passed to the original callback function.
   * @returns {Promise<U>} - A promise that resolves with the result of the original callback function.
   */
  const wrappedCallback: AnyAsyncFunction<T, U> = useFastCallback(async (...args: T) => {
    addLoading();
    try {
      return await callback(...args);
    } finally {
      removeLoading();
    }
  });

  return wrappedCallback;
}
