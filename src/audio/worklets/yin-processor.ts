/**
 * YIN Pitch Tracker — AudioWorklet Processor
 *
 * Implements the YIN algorithm (de Cheveigné & Kawahara, 2002) for
 * fundamental frequency (f0) estimation, running entirely inside an
 * AudioWorkletProcessor thread so the main thread never touches raw samples.
 *
 * Parameters (set via constructor options):
 *   - windowSize:  YIN analysis window in samples (default 2048)
 *   - threshold:   aperiodicity threshold for voiced decision (default 0.15)
 *   - sampleRate:  inherited from AudioWorkletGlobalScope
 *
 * Output: posts { t, f0, conf } messages to the main thread via MessagePort.
 *   - t:    timestamp in seconds (performance.now() approximation from frame count)
 *   - f0:   estimated fundamental frequency in Hz (0 if unvoiced)
 *   - conf: confidence = 1 − aperiodicity (0–1, higher = more confident)
 */

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_WINDOW_SIZE = 2048;
const DEFAULT_THRESHOLD = 0.15;
const HOP_SIZE = 512;
const MIN_F0 = 70;   // Hz — lower bound of search range
const MAX_F0 = 800;  // Hz — upper bound of search range
const MEDIAN_FILTER_SIZE = 5;

class YinProcessor extends AudioWorkletProcessor {
  private windowSize: number;
  private threshold: number;
  private halfWindow: number;
  private minLag: number;
  private maxLag: number;
  private buffer: Float32Array;
  private bufferWriteIndex: number;
  private frameCount: number;
  private f0History: number[];
  private noiseGate: number;
  private absoluteMinGate: number;

  constructor(options?: AudioWorkletNodeOptions) {
    super();

    const processorOptions = options?.processorOptions ?? {};
    this.windowSize = processorOptions.windowSize ?? DEFAULT_WINDOW_SIZE;
    this.threshold = processorOptions.threshold ?? DEFAULT_THRESHOLD;
    this.halfWindow = Math.floor(this.windowSize / 2);
    this.noiseGate = processorOptions.noiseGate ?? 0.001;
    this.absoluteMinGate = 0.0005;

    // Lag range derived from f0 search range
    this.minLag = Math.floor(sampleRate / MAX_F0);
    this.maxLag = Math.ceil(sampleRate / MIN_F0);

    // Ring buffer to accumulate samples between hops
    this.buffer = new Float32Array(this.windowSize);
    this.bufferWriteIndex = 0;
    this.frameCount = 0;

    // Median filter history for f0 smoothing
    this.f0History = [];

    // Listen for noise gate updates from the main thread
    this.port.onmessage = (event) => {
      if (event.data.type === 'setNoiseGate') {
        this.noiseGate = Math.max(event.data.value, this.absoluteMinGate);
      }
    };
  }

  /**
   * Step 1 of YIN: Compute the difference function d(τ) for each lag τ.
   * d(τ) = Σ (x[j] − x[j+τ])²   for j = 0 … W/2 − 1
   */
  private differenceFunction(x: Float32Array): Float32Array {
    const d = new Float32Array(this.halfWindow);
    d[0] = 0;
    for (let tau = 1; tau < this.halfWindow; tau++) {
      let sum = 0;
      for (let j = 0; j < this.halfWindow; j++) {
        const delta = x[j] - x[j + tau];
        sum += delta * delta;
      }
      d[tau] = sum;
    }
    return d;
  }

  /**
   * Step 2 of YIN: Cumulative mean normalized difference function d'(τ).
   * d'(0) = 1;  d'(τ) = d(τ) / [(1/τ) Σ d(j) for j=1…τ]
   */
  private cumulativeMeanNormalize(d: Float32Array): Float32Array {
    const dnorm = new Float32Array(d.length);
    dnorm[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < d.length; tau++) {
      runningSum += d[tau];
      dnorm[tau] = runningSum > 0 ? d[tau] * tau / runningSum : 1;
    }
    return dnorm;
  }

  /**
   * Step 3 of YIN: Absolute threshold.
   * Find the first τ (within [minLag, maxLag]) where d'(τ) < threshold
   * and d'(τ) is a local minimum.
   * Returns { lag, aperiodicity } or null if unvoiced.
   */
  private absoluteThreshold(
    dnorm: Float32Array
  ): { lag: number; aperiodicity: number } | null {
    const searchEnd = Math.min(this.maxLag, dnorm.length - 1);

    // Find the first dip below threshold
    for (let tau = this.minLag; tau < searchEnd; tau++) {
      if (dnorm[tau] < this.threshold) {
        // Walk to the local minimum
        while (tau + 1 < searchEnd && dnorm[tau + 1] < dnorm[tau]) {
          tau++;
        }
        return { lag: tau, aperiodicity: dnorm[tau] };
      }
    }

    // Fallback: if no dip below threshold, find the global minimum in range
    let minVal = Infinity;
    let minTau = this.minLag;
    for (let tau = this.minLag; tau < searchEnd; tau++) {
      if (dnorm[tau] < minVal) {
        minVal = dnorm[tau];
        minTau = tau;
      }
    }

    // Only return if reasonably periodic
    if (minVal < 0.5) {
      return { lag: minTau, aperiodicity: minVal };
    }
    return null;
  }

  /**
   * Step 4 of YIN: Parabolic interpolation around the estimated lag
   * to get sub-sample accuracy.
   */
  private parabolicInterpolation(dnorm: Float32Array, tau: number): number {
    if (tau <= 0 || tau >= dnorm.length - 1) return tau;

    const s0 = dnorm[tau - 1];
    const s1 = dnorm[tau];
    const s2 = dnorm[tau + 1];

    const adjustment = (s0 - s2) / (2 * (s0 - 2 * s1 + s2));

    if (Math.abs(adjustment) < 1) {
      return tau + adjustment;
    }
    return tau;
  }

  /**
   * Compute RMS energy of the analysis window.
   */
  private computeRMS(x: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < x.length; i++) {
      sum += x[i] * x[i];
    }
    return Math.sqrt(sum / x.length);
  }

  /**
   * Apply a 5-frame median filter to smooth f0 estimates.
   */
  private medianFilter(f0: number): number {
    this.f0History.push(f0);
    if (this.f0History.length > MEDIAN_FILTER_SIZE) {
      this.f0History.shift();
    }
    if (this.f0History.length < MEDIAN_FILTER_SIZE) {
      return f0; // Not enough history yet
    }
    const sorted = [...this.f0History].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  /**
   * Run the full YIN pipeline on the current buffer contents.
   */
  private analyze(): { f0: number; conf: number } {
    const rms = this.computeRMS(this.buffer);

    // Gate: if signal is below the noise floor, declare unvoiced
    if (rms < this.noiseGate) {
      return { f0: 0, conf: 0 };
    }

    // YIN steps
    const diff = this.differenceFunction(this.buffer);
    const dnorm = this.cumulativeMeanNormalize(diff);
    const result = this.absoluteThreshold(dnorm);

    if (!result) {
      return { f0: 0, conf: 0 };
    }

    // Parabolic interpolation for sub-sample accuracy
    const refinedLag = this.parabolicInterpolation(dnorm, result.lag);
    const rawF0 = sampleRate / refinedLag;

    // Range check
    if (rawF0 < MIN_F0 || rawF0 > MAX_F0) {
      return { f0: 0, conf: 0 };
    }

    // Median filter
    const smoothedF0 = this.medianFilter(rawF0);
    const confidence = 1 - result.aperiodicity;

    return { f0: smoothedF0, conf: confidence };
  }

  /**
   * AudioWorkletProcessor.process() — called for each render quantum (128 samples).
   * We accumulate samples in a ring buffer and analyze every HOP_SIZE samples.
   */
  process(
    inputs: Float32Array[][],
    _outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0]?.[0];
    if (!input) return true;

    // Write incoming samples into the ring buffer
    for (let i = 0; i < input.length; i++) {
      this.buffer[this.bufferWriteIndex] = input[i];
      this.bufferWriteIndex++;

      // When buffer is full, analyze and then shift by hop size
      if (this.bufferWriteIndex >= this.windowSize) {
        this.frameCount++;

        const { f0, conf } = this.analyze();
        const t = this.frameCount * HOP_SIZE / sampleRate;

        this.port.postMessage({ t, f0, conf });

        // Shift buffer by hop size (keep overlap)
        this.buffer.copyWithin(0, HOP_SIZE);
        this.bufferWriteIndex = this.windowSize - HOP_SIZE;
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('yin-processor', YinProcessor);
