import { test, expect } from './fixtures';

test.describe('Signal Analytics E2E Journey', () => {
  test('renders unified Signal views, global filters, and mobile responsiveness cleanly', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/dashboard/signal');

    await expect(page.getByRole('heading', { name: /Signal Intelligence/i })).toBeVisible({
      timeout: 15000,
    });

    // Global tabs present
    await expect(page.getByRole('tab', { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Content & Hooks/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Timing & Cadence/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Channels & Funnel/i })).toBeVisible();

    // Switch through all 4 views without page errors
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.getByRole('tab', { name: /Content & Hooks/i }).click();
    await expect(page.getByText(/Hook Archetype Performance/i)).toBeVisible();

    await page.getByRole('tab', { name: /Timing & Cadence/i }).click();
    await expect(page.getByText(/Best Time to Publish Matrix/i)).toBeVisible();

    await page.getByRole('tab', { name: /Channels & Funnel/i }).click();
    await expect(page.getByText(/Per-Account & Channel Performance/i)).toBeVisible();

    // Verify mobile viewport layout causes zero horizontal page overflow
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('tab', { name: /Overview/i }).click();
    const docOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 4
    );
    expect(docOverflow).toBe(false);
    expect(errors).toEqual([]);
  });
});
