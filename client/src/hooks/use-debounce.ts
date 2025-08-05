import { useState, useEffect } from 'react';

/**
 * A custom hook to debounce a value. This is useful for delaying the execution of a function
 * until after a certain amount of time has passed since the last event. For example,
 * delaying an API call until the user has stopped typing in a search bar.
 * @param value The value to be debounced.
 * @param delay The debounce delay in milliseconds.
 * @returns The debounced value, which updates only after the delay has passed.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // State to store the debounced value.
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(
    () => {
      // Set up a timer that will update the debounced value after the specified delay.
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // This cleanup function will be called if the `value` or `delay` changes
      // before the timeout has completed. It clears the previous timer.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // The effect will re-run only if the value or delay changes.
  );

  return debouncedValue;
}
