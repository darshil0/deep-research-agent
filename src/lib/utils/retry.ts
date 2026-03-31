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
        err.message?.includes('quota') ||
        err.message?.includes('rate limit');

      if (!isTransient && i < maxRetries) {
        // If it's not clearly transient, we might still want to retry a few times for Gemini/Tavily
        // but maybe with a shorter limit. For now, let's just retry all errors up to maxRetries.
      }

      if (i === maxRetries) break;

      const delay = initialDelay * Math.pow(2, i);
      console.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms due to: ${err.message || err}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
