/**
 * Noise-Floor Calibration Module
 *
 * Before voice detection (FR-2), this module captures 3 seconds of silence
 * from the mic, measures the RMS distribution, and sets an adaptive noise gate.
 *
 * Gate = max(noise_p95 × 3, absoluteMinimum)
 *
 * If the noise floor is too high (above a "too noisy" threshold), the user
 * is warned to move somewhere quieter.
 */

export interface CalibrationResult {
  /** RMS noise gate value to use for voiced/unvoiced classification */
  noiseGate: number;
  /** The measured 95th percentile RMS of the noise floor */
  noiseP95: number;
  /** Mean RMS during calibration */
  noiseMean: number;
  /** Whether the environment is too noisy for reliable detection */
  tooNoisy: boolean;
  /** Duration of calibration in seconds */
  durationSeconds: number;
}

/** Configurable calibration parameters */
export interface CalibrationConfig {
  /** Duration of silence capture in seconds (default 3) */
  durationSeconds: number;
  /** Multiplier applied to noise p95 to set the gate (default 3) */
  gateMultiplier: number;
  /** Absolute minimum RMS gate (default 0.0005) */
  absoluteMinGate: number;
  /** RMS threshold above which the environment is "too noisy" (default 0.05) */
  tooNoisyThreshold: number;
  /** Analysis frame size in samples (default 2048) */
  frameSize: number;
}

const DEFAULT_CONFIG: CalibrationConfig = {
  durationSeconds: 3,
  gateMultiplier: 3,
  absoluteMinGate: 0.0005,
  tooNoisyThreshold: 0.05,
  frameSize: 2048,
};

/**
 * Capture ambient noise and compute the noise gate.
 *
 * @param stream - an active MediaStream (from getUserMedia)
 * @param config - optional overrides for calibration parameters
 * @param onProgress - optional callback with progress 0–1
 * @returns CalibrationResult with the computed noise gate
 */
export async function calibrateNoiseFloor(
  stream: MediaStream,
  config: Partial<CalibrationConfig> = {},
  onProgress?: (progress: number) => void
): Promise<CalibrationResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);

  // Create a ScriptProcessor to capture raw RMS values
  // (Using ScriptProcessor here because we need synchronous RMS accumulation
  //  during a short calibration window; this is simpler than an AudioWorklet
  //  for this one-shot task.)
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = cfg.frameSize;
  source.connect(analyser);

  const timeDomainData = new Float32Array(analyser.fftSize);
  const rmsValues: number[] = [];

  const totalSamples = Math.ceil(
    cfg.durationSeconds * audioContext.sampleRate / cfg.frameSize
  );

  return new Promise<CalibrationResult>((resolve) => {
    let sampleCount = 0;

    const measureInterval = setInterval(() => {
      analyser.getFloatTimeDomainData(timeDomainData);

      // Compute RMS for this frame
      let sum = 0;
      for (let i = 0; i < timeDomainData.length; i++) {
        sum += timeDomainData[i] * timeDomainData[i];
      }
      const rms = Math.sqrt(sum / timeDomainData.length);
      rmsValues.push(rms);

      sampleCount++;
      onProgress?.(Math.min(sampleCount / totalSamples, 1));

      if (sampleCount >= totalSamples) {
        clearInterval(measureInterval);
        source.disconnect();
        audioContext.close();

        // Sort RMS values to find percentiles
        const sorted = [...rmsValues].sort((a, b) => a - b);
        const p95Index = Math.floor(sorted.length * 0.95);
        const noiseP95 = sorted[p95Index] ?? sorted[sorted.length - 1];
        const noiseMean =
          rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length;

        // Compute gate
        const noiseGate = Math.max(
          noiseP95 * cfg.gateMultiplier,
          cfg.absoluteMinGate
        );

        const tooNoisy = noiseP95 > cfg.tooNoisyThreshold;

        resolve({
          noiseGate,
          noiseP95,
          noiseMean,
          tooNoisy,
          durationSeconds: cfg.durationSeconds,
        });
      }
    }, (cfg.frameSize / audioContext.sampleRate) * 1000);
  });
}
