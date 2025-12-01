// Sentry error tracking configuration
// To enable, add NEXT_PUBLIC_SENTRY_DSN to your .env file
// Install Sentry: npm install --save-dev @sentry/nextjs

// Use a function to create the import string to prevent Next.js from analyzing it at build time
function getSentryModule() {
  // This prevents Next.js from trying to resolve the module at build time
  const moduleName = '@sentry/nextjs';
  return moduleName;
}

export function initSentry() {
  if (typeof window === 'undefined') {
    return;
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  // Use setTimeout to defer import until after build
  setTimeout(() => {
    const moduleName = getSentryModule();
    // Use Function constructor to create a dynamic import that won't be analyzed at build time
    const importSentry = new Function('moduleName', 'return import(moduleName)');
    importSentry(moduleName)
      .then((Sentry: any) => {
        Sentry.init({
          dsn,
          environment: process.env.NODE_ENV,
          tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
          integrations: [
            new Sentry.BrowserTracing(),
            new Sentry.Replay(),
          ],
        });
      })
      .catch(() => {
        // Sentry not installed, silently fail
      });
  }, 0);
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (typeof window === 'undefined') {
    return;
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  // Use Function constructor for truly dynamic import
  setTimeout(() => {
    const moduleName = getSentryModule();
    const importSentry = new Function('moduleName', 'return import(moduleName)');
    importSentry(moduleName)
      .then((Sentry: any) => {
        Sentry.captureException(error, {
          extra: context,
        });
      })
      .catch(() => {
        // Sentry not available, ignore
      });
  }, 0);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (typeof window === 'undefined') {
    return;
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  // Use Function constructor for truly dynamic import
  setTimeout(() => {
    const moduleName = getSentryModule();
    const importSentry = new Function('moduleName', 'return import(moduleName)');
    importSentry(moduleName)
      .then((Sentry: any) => {
        Sentry.captureMessage(message, level);
      })
      .catch(() => {
        // Sentry not available, ignore
      });
  }, 0);
}

