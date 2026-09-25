import { describe, it, expect } from 'vitest';
import { evaluateCorpus, build100SampleCorpus } from '../../src/audio/corpus-evaluator';

describe('Phase 3: 100-Sample Singing Corpus Validation', () => {
  it('builds exactly 100 labelled singing samples covering all 12 tonics', () => {
    const corpus = build100SampleCorpus();
    expect(corpus.length).toBe(100);

    const tonics = new Set(corpus.map((s) => s.expectedTonic));
    expect(tonics.size).toBe(12); // All 12 pitch classes present
  });

  it('achieves ≥ 85% top-1 key detection accuracy on the 100-sample corpus (TRD §12 Target)', () => {
    const report = evaluateCorpus();

    console.log(`\n📊 [Corpus Evaluation Report]`);
    console.log(`  • Total Evaluated Samples: ${report.totalSamples}`);
    console.log(`  • Correct Top-1 Matches: ${report.correctTop1} / ${report.totalSamples} (${report.top1AccuracyPercent.toFixed(1)}%)`);
    console.log(`  • Top-2 (with Runner-up) Accuracy: ${report.top2AccuracyPercent.toFixed(1)}%`);
    console.log(`  • Low Confidence Warnings: ${report.lowConfidenceCount}`);

    // TRD §12 pass criterion: target ≥85% top-1 accuracy
    expect(report.top1AccuracyPercent).toBeGreaterThanOrEqual(85.0);
    expect(report.top2AccuracyPercent).toBeGreaterThanOrEqual(95.0);
  });
});
