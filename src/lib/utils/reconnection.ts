/**
 * Calculates the exponential backoff delay for reconnection attempts.
 * @param attempt Current attempt number (starting from 0).
 * @param initialDelay Initial delay in milliseconds.
 * @param maxDelay Maximum delay in milliseconds.
 * @returns Delay in milliseconds.
 */
export function getReconnectionDelay(
  attempt: number,
  initialDelay: number = 1000,
  maxDelay: number = 10000
): number {
  return Math.min(initialDelay * Math.pow(1.5, attempt), maxDelay);
}
