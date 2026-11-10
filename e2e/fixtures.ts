import { test as base, type Page } from '@playwright/test';

interface TestFixtures {
  authenticatedPage: Page;
}

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use, testInfo) => {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;
    if (!email || !password) {
      testInfo.skip(true, 'E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set for authenticated E2E tests');
      return;
    }

    const res = await page.request.post('/api/auth/signin', {
      data: { email, password },
    });
    if (!res.ok()) {
      throw new Error(`Failed to authenticate E2E test user (${res.status()})`);
    }
    await use(page);
  },
});

export { expect } from '@playwright/test';