'use client';

interface RateLimitErrorProps {
  retryAfter?: number | null;
  rateLimitUsage?: string | null;
  rateLimitLimit?: string | null;
}

export default function RateLimitError({ retryAfter, rateLimitUsage, rateLimitLimit }: RateLimitErrorProps) {
  const formatRetryTime = (seconds: number | null | undefined) => {
    if (!seconds) return null;
    if (seconds < 60) return `in ${seconds} seconds`;
    const minutes = Math.ceil(seconds / 60);
    return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Strava API Rate Limit Exceeded
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>
              You&apos;ve reached the Strava API rate limit. Strava limits API requests to protect their servers.
            </p>
            {retryAfter && (
              <p className="mt-2 font-semibold">
                Please try again {formatRetryTime(retryAfter)}.
              </p>
            )}
            {rateLimitUsage && rateLimitLimit && (
              <p className="mt-2 text-xs">
                Usage: {rateLimitUsage} / {rateLimitLimit} requests
              </p>
            )}
            <div className="mt-4">
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                <strong>Tips to avoid rate limits:</strong>
              </p>
              <ul className="mt-1 text-xs text-yellow-600 dark:text-yellow-400 list-disc list-inside space-y-1">
                <li>Wait a few minutes before making more requests</li>
                <li>Reduce the number of activities loaded at once</li>
                <li>Use the filters to load specific activities instead of all</li>
                <li>Strava limits: 600 requests per 15 minutes, 30,000 per day</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

