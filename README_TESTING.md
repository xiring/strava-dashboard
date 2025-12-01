# Testing Guide

This document explains how to run tests for the Strava Dashboard application.

## Unit Tests

Unit tests are written using Jest and React Testing Library.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Tests are located in the `__tests__` directory. Example test structure:

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Integration Tests

Integration tests are also written with Jest and test how different parts of the application work together.

### Running Integration Tests

```bash
npm test -- --testPathPattern=integration
```

## E2E Tests

End-to-end tests are written using Playwright.

### Prerequisites

Install Playwright browsers:

```bash
npx playwright install
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run tests in headed mode
npx playwright test --headed
```

### Writing E2E Tests

E2E tests are located in the `e2e` directory. Example:

```typescript
import { test, expect } from '@playwright/test';

test('should load dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Strava Dashboard/i);
});
```

## Test Coverage

To generate a coverage report:

```bash
npm run test:coverage
```

Coverage reports will be generated in the `coverage` directory.

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test

- name: Run E2E tests
  run: npm run test:e2e
```

