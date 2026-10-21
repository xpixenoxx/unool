import { test as base, type Page } from '@playwright/test';

interface TestFixtures {
  authenticatedPage: Page;
}

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // In a real setup, this would authenticate the user
    // For now, we just pass the page through
    await use(page);
  },
});

export { expect } from '@playwright/test';