/**
 * Represents an asynchronous function with any number of arguments.
 *
 * @template T - An array of argument types.
 * @template U - The return type of the asynchronous function.
 * @param {...T} args - Arguments to be passed to the asynchronous function.
 * @returns {Promise<U>} - A promise that resolves with the result of the asynchronous function.
 */
export type AnyAsyncFunction<T extends any[], U> = (...args: T) => Promise<U>;
