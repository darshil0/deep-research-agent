/**
 * Generic retry function with exponential backoff.
 * @param fn The function to retry.
 * @param maxRetries Maximum number of retries.
 * @param initialDelay Initial delay in milliseconds.
 * @returns The result of the function.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      
      // Check if it's a transient error (e.g., 429 Too Many Requests, 5xx Server Error)
      const isTransient = 
        err.status === 429 || 
        (err.status >= 500 && err.status <= 599) ||
        err.code === 'ECONNABORTED' ||
        err.code === 'ETIMEDOUT' ||
        err.message?.toLowerCase().includes('quota') ||
        err.message?.toLowerCase().includes('rate limit') ||
        err.message?.toLowerCase().includes('timeout') ||
        err.message?.toLowerCase().includes('network');

      // Do NOT retry on 400 Bad Request (except 429 which is handled above)
      // Invalid API key is a 400 error.
      if (!isTransient || i === maxRetries) {
        throw lastError;
      }

      const delay = initialDelay * Math.pow(2, i);
      console.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms due to: ${err.message || err}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
