import { test, expect } from '@playwright/test';

test.describe('Music Mantra Phase 1 End-to-End User Journey', () => {
  test('Happy Path: Welcome -> Mic -> Calibrate -> Scale -> Condition -> Listen -> Chant', async ({ page }) => {
    await page.goto('/');

    // 1. Welcome Screen & Disclaimer
    await expect(page.getByText('Welcome to Your 45-Day Swara Journey')).toBeVisible();
    await expect(page.getByText("Begin Today's Practice")).toBeDisabled();

    // Open & accept disclaimer modal
    await page.getByRole('button', { name: 'Read & Accept Medical Disclaimer' }).click();
    await expect(page.getByText('Important Medical & Usage Disclaimer')).toBeVisible();
    await page.getByRole('button', { name: 'I Understand & Accept' }).click();

    // Disclaimer accepted, button should be enabled
    await expect(page.getByText('Medical Disclaimer Accepted')).toBeVisible();
    const beginBtn = page.getByRole('button', { name: "Begin Today's Practice" });
    await expect(beginBtn).toBeEnabled();
    await beginBtn.click();

    // 2. Mic Permission Screen
    await expect(page.getByText('Microphone Access Required')).toBeVisible();
    await page.getByRole('button', { name: 'Grant Microphone Access' }).click();

    // 3. Calibration Screen
    await expect(page.getByText('Step 1: Noise Floor Calibration')).toBeVisible();
    // Wait for calibration (3s) to complete and transition to Step 2
    await expect(page.getByText('Step 2: Voice Scale Detection')).toBeVisible({ timeout: 10000 });

    // 4. Sing / Key Detection Screen
    await expect(page.getByText('Sing any familiar song or chant naturally')).toBeVisible();

    // Wait until 15s timer finishes and it auto-proceeds
    await expect(page.getByText('Scale & Tonic (Sa) Result')).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Confirm Key & Pick Mantra' }).click();

    // 6. Condition Selection Menu Screen
    await expect(page.getByText('Step 3: Select Health Condition & Mantra')).toBeVisible();
    await expect(page.getByText('Diabetes Care').first()).toBeVisible();
    await expect(page.getByText('Thyroid Balance').first()).toBeVisible();
    await expect(page.getByText('Hypertension Relief').first()).toBeVisible();

    // Select Thyroid condition
    await page.getByRole('button', { name: 'Select Thyroid Balance Theme' }).click();

    // 7. Listen Screen
    await expect(page.getByText('Step 4: Listen to Reference Mantra')).toBeVisible();
    await expect(page.getByText('"Ham"')).toBeVisible();

    // Click Go Ahead to start half-duplex chanting
    await page.getByRole('button', { name: 'Go Ahead and Start Chanting' }).click();

    // 8. Chant Eval Screen
    await expect(page.getByText('Step 5: Practice & Evaluation')).toBeVisible();
  });

  test('Session History View Navigation', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'View Session History' }).click();
    await expect(page.getByText('Session History Log')).toBeVisible();
    await expect(page.getByText('No sessions recorded yet.')).toBeVisible();

    await page.getByRole('button', { name: '← Back to Dashboard' }).click();
    await expect(page.getByText('Welcome to Your 45-Day Swara Journey')).toBeVisible();
  });
});
