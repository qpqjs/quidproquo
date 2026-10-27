import { useEffect } from 'react';

export function useOnKeyDownEffect(targetKey: KeyboardEvent['key'], isActive: boolean, callback?: () => void) {
  useEffect(() => {
    if (!isActive || !callback) {
      return () => {
        // NOOP
      };
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [targetKey, isActive, callback]);
}
