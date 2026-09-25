import { test, expect } from '@playwright/test';

test.describe('Music Mantra Phase 1 End-to-End User Journey', () => {
  test('Happy Path: Welcome -> Mic -> Calibrate -> Scale -> Condition -> Listen -> Chant', async ({ page }) => {
    await page.goto('/');

    // 1. Welcome Screen & Disclaimer
    await expect(page.getByText('Swara Healing — Music Mantra')).toBeVisible();
    await expect(page.getByText("Begin Today's Practice")).toBeDisabled();

    // Open & accept disclaimer modal
    await page.getByRole('button', { name: 'Read & Accept Medical Disclaimer' }).click();
    await expect(page.getByText('Important Medical & Usage Disclaimer')).toBeVisible();
    await page.getByRole('button', { name: 'I Understand & Accept' }).click();

    // Disclaimer accepted, button should be enabled
    await expect(page.getByText('✓ Medical Disclaimer Accepted')).toBeVisible();
    const beginBtn = page.getByRole('button', { name: "Begin Today's Practice" });
    await expect(beginBtn).toBeEnabled();
    await beginBtn.click();

    // 2. Mic Permission Screen
    await expect(page.getByText('Microphone Access Required')).toBeVisible();
    await page.getByRole('button', { name: 'Grant Microphone Access' }).click();

    // 3. Calibration Screen
    await expect(page.getByText('Step 1: Noise-Floor Calibration')).toBeVisible();
    // Wait for calibration (3s) to complete and transition to Step 2
    await expect(page.getByText('Step 2: Key & Sa Detection')).toBeVisible({ timeout: 10000 });

    // 4. Sing / Key Detection Screen
    await expect(page.getByText('"Please sing a song or chant comfortably"')).toBeVisible();

    // Wait until voiced target met or 15s timer finishes
    const finishBtn = page.getByRole('button', { name: /Finish & Analyze Key/i });
    await expect(finishBtn).toBeEnabled({ timeout: 20000 });
    await finishBtn.click();

    // 5. Scale & Sa Result Screen
    await expect(page.getByText('Scale & Tonic (Sa) Result')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm Key & Pick Mantra' }).click();

    // 6. Condition Selection Menu Screen
    await expect(page.getByText('Step 3: Select Health Condition & Mantra')).toBeVisible();
    await expect(page.getByText('Diabetes')).toBeVisible();
    await expect(page.getByText('Thyroid')).toBeVisible();
    await expect(page.getByText('Hypertension')).toBeVisible();

    // Select Thyroid condition
    await page.getByRole('button', { name: 'Select Thyroid' }).click();

    // 7. Listen Screen
    await expect(page.getByText('Step 4: Listen to Mantra Recording')).toBeVisible();
    await expect(page.getByText('"Ham"')).toBeVisible();

    // Click Go Ahead to start half-duplex chanting
    await page.getByRole('button', { name: 'Go Ahead and Start Chanting' }).click();

    // 8. Chant Eval Screen
    await expect(page.getByText('Step 5: Initial Pitch Accuracy Evaluation')).toBeVisible();
  });

  test('Session History View Navigation', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'View Session History' }).click();
    await expect(page.getByText('Session History Log')).toBeVisible();
    await expect(page.getByText('No sessions recorded yet.')).toBeVisible();

    await page.getByRole('button', { name: '← Back to Dashboard' }).click();
    await expect(page.getByText('Swara Healing — Music Mantra')).toBeVisible();
  });
});
