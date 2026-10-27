import { useFastCallback } from '../hooks';

type UpdaterFunction<T> = (property: keyof T) => (value: T[keyof T]) => void;

export const useStateUpdater = <T>(setState: React.Dispatch<React.SetStateAction<T>>): UpdaterFunction<T> => {
  return useFastCallback(
    (property: keyof T) => {
      return (value: T[keyof T]) => {
        setState((prevState) => ({
          ...prevState,
          [property]: value,
        }));
      };
    },
    [setState],
  );
};
