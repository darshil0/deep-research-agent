import { Citation, SearchFilters } from "./types.ts";

export interface SearchProvider {
  name: string;
  search(query: string, context: string, filters?: SearchFilters): Promise<Citation[]>;
}

export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly threshold: number = 3;
  private readonly cooldown: number = 5 * 60 * 1000; // 5 minutes

  constructor(threshold: number = 3, cooldown: number = 300000) {
    this.threshold = threshold;
    this.cooldown = cooldown;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.cooldown) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error(`Circuit breaker is OPEN for this provider`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      console.warn(`Circuit breaker activated: Provider disabled for ${this.cooldown / 1000}s`);
    }
  }

  isOpen(): boolean {
    if (this.state === 'OPEN' && Date.now() - this.lastFailureTime > this.cooldown) {
      return false; // Technically half-open but practically available
    }
    return this.state === 'OPEN';
  }
}

export class CircuitBreakerSearchProvider implements SearchProvider {
  private provider: SearchProvider;
  private breaker: CircuitBreaker;

  constructor(provider: SearchProvider) {
    this.provider = provider;
    this.breaker = new CircuitBreaker();
  }

  get name() { return this.provider.name; }

  async search(query: string, context: string, filters?: SearchFilters): Promise<Citation[]> {
    return await this.breaker.execute(() => this.provider.search(query, context, filters));
  }
}
