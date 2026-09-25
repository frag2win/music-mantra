import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPitchQA } from '../../scripts/pitch-qa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Phase 2: Pitch QA & Manifest Verification', () => {
  it('verifies that all 72 mantra targets conform strictly to Just Intonation ratios', () => {
    const manifestPath = resolve(__dirname, '../../public/mantras/manifest.json');
    const result = runPitchQA(manifestPath);

    expect(result.total).toBe(72);
    expect(result.errors).toBe(0);
  });
});
