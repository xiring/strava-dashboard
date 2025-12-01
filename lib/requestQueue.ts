// Request queue with rate limiting and exponential backoff
// Prevents hitting rate limits by queuing and throttling requests

interface QueuedRequest {
  id: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retries: number;
  priority: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private requestCount = 0;
  private windowStart = Date.now();
  private readonly maxRequestsPerWindow = 550; // Stay under 600 limit
  private readonly windowDuration = 15 * 60 * 1000; // 15 minutes
  private readonly minDelayBetweenRequests = 100; // 100ms minimum delay
  private readonly maxRetries = 3;
  private readonly baseBackoffDelay = 1000; // 1 second

  async add<T>(
    id: string,
    execute: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        id,
        execute,
        resolve,
        reject,
        retries: 0,
        priority,
      });

      // Sort by priority (higher priority first)
      this.queue.sort((a, b) => b.priority - a.priority);

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Check if we need to wait for rate limit window
      const now = Date.now();
      const timeSinceWindowStart = now - this.windowStart;

      if (timeSinceWindowStart >= this.windowDuration) {
        // Reset window
        this.requestCount = 0;
        this.windowStart = now;
      }

      // Check if we're approaching rate limit
      if (this.requestCount >= this.maxRequestsPerWindow) {
        const waitTime = this.windowDuration - timeSinceWindowStart;
        if (waitTime > 0) {
          console.log(`Rate limit approaching. Waiting ${waitTime}ms...`);
          await this.delay(waitTime);
          this.requestCount = 0;
          this.windowStart = Date.now();
        }
      }

      const request = this.queue.shift();
      if (!request) break;

      try {
        // Add minimum delay between requests
        if (this.requestCount > 0) {
          await this.delay(this.minDelayBetweenRequests);
        }

        const result = await request.execute();
        this.requestCount++;
        request.resolve(result);
      } catch (error: any) {
        // Handle rate limit errors with exponential backoff
        if (error.isRateLimit || error.status === 429) {
          if (request.retries < this.maxRetries) {
            const backoffDelay = this.baseBackoffDelay * Math.pow(2, request.retries);
            const retryAfter = error.retryAfter || backoffDelay / 1000;
            const waitTime = Math.max(retryAfter * 1000, backoffDelay);

            console.log(`Rate limited. Retrying in ${waitTime}ms (attempt ${request.retries + 1}/${this.maxRetries})`);

            request.retries++;
            await this.delay(waitTime);
            this.queue.unshift(request); // Add back to front of queue
          } else {
            request.reject(error);
          }
        } else {
          // For other errors, retry with exponential backoff
          if (request.retries < this.maxRetries) {
            const backoffDelay = this.baseBackoffDelay * Math.pow(2, request.retries);
            request.retries++;
            await this.delay(backoffDelay);
            this.queue.unshift(request);
          } else {
            request.reject(error);
          }
        }
      }
    }

    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  clear(): void {
    this.queue = [];
  }
}

export const requestQueue = new RequestQueue();

