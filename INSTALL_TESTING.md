# Installing Testing Dependencies

To enable testing features, install the following dependencies:

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest @playwright/test @sentry/nextjs
```

## Package Details

- **jest** - JavaScript testing framework
- **jest-environment-jsdom** - JSDOM environment for Jest (simulates browser environment)
- **@testing-library/react** - React testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers for DOM testing
- **@types/jest** - TypeScript type definitions for Jest
- **@playwright/test** - End-to-end testing framework
- **@sentry/nextjs** - Error tracking (optional, only needed if you want Sentry integration)

## After Installation

1. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

2. Run tests:
   ```bash
   npm test              # Unit tests (Jest)
   npm run test:e2e      # E2E tests (Playwright - separate from Jest)
   ```

## Note

- E2E tests in the `e2e/` directory are excluded from Jest and should only be run with Playwright
- Unit tests use Jest and are located in `__tests__/` directory
- The Sentry package is optional - the app will work without it
