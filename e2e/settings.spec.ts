import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_AUTH_EMAIL || '';
const TEST_PASSWORD = process.env.E2E_AUTH_PASSWORD || '';

const SETTINGS_TABS = [
  'account',
  'security',
  'notifications',
  'channels',
  'ai-voice',
  'workspace',
] as const;

test.describe('Settings experience, redirects, responsiveness & accessibility', () => {
  test('unauthenticated requests to /dashboard/settings and /dashboard/channels redirect cleanly without 5xx', async ({
    page,
  }) => {
    const settingsRes = await page.goto('/dashboard/settings');
    expect(settingsRes?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/(login|signin)/);

    const channelsRes = await page.goto('/dashboard/channels');
    expect(channelsRes?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/(login|signin|dashboard\/settings\?tab=channels)/);
  });

  test.describe('Authenticated Settings walkthrough (requires E2E_AUTH_EMAIL & E2E_AUTH_PASSWORD)', () => {
    test.beforeEach(async ({ page }) => {
      test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run authenticated Settings E2E');

      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    });

    test('renders 2-group / 6-section desktop navigation and keyboard focus without horizontal overflow at 1440px', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/dashboard/settings');

      const nav = page.getByRole('navigation', { name: 'Settings sections' });
      await expect(nav).toBeVisible();
      await expect(nav.getByRole('button')).toHaveCount(6);

      // Keyboard Tab accessibility check
      await nav.getByRole('button').first().focus();
      await page.keyboard.press('Tab');
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focusedTag);

      // Verify zero horizontal overflow across all 6 tabs
      for (const tab of SETTINGS_TABS) {
        await page.goto(`/dashboard/settings?tab=${tab}`);
        await expect(page.locator('h1')).toContainText('Settings');
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(overflow, `Desktop overflow detected on ?tab=${tab}`).toBe(false);
      }
    });

    test('normalizes legacy query URLs (?tab=persona -> ?tab=ai-voice, /dashboard/channels -> ?tab=channels)', async ({
      page,
    }) => {
      await page.goto('/dashboard/settings?tab=persona');
      await expect(page).toHaveURL(/\/dashboard\/settings\?tab=ai-voice/);

      await page.goto('/dashboard/channels');
      await expect(page).toHaveURL(/\/dashboard\/settings\?tab=channels/);
    });

    test('enforces >= 44px mobile touch targets and zero horizontal overflow at 390px', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/dashboard/settings');

      const mobileSelect = page.locator('#mobile-settings-section');
      await expect(mobileSelect).toBeVisible();

      const selectBox = await mobileSelect.boundingBox();
      expect(selectBox?.height ?? 0).toBeGreaterThanOrEqual(44);

      for (const tab of SETTINGS_TABS) {
        await mobileSelect.selectOption(tab);
        await expect(page).toHaveURL(new RegExp(`tab=${tab}`));
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(overflow, `Mobile 390px overflow detected on ?tab=${tab}`).toBe(false);
      }
    });
  });
});
