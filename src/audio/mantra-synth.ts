/**
 * Harmonic Tanpura Drone & Vocal Reference Mantra Synthesizer
 * Generates an authentic multi-harmonic Just Intonation reference tone
 * as a seamless AudioBuffer fallback when recorded audio files are not present.
 */

export interface SynthMantraOptions {
  saHz: number;
  targetHz: number;
  condition: 'diabetes' | 'thyroid' | 'hypertension';
  durationSeconds?: number;
  sampleRate?: number;
}

export function generateHarmonicMantraBuffer(
  audioContext: AudioContext,
  options: SynthMantraOptions
): AudioBuffer {
  const { saHz, targetHz, durationSeconds = 6.0 } = options;
  const sampleRate = audioContext.sampleRate;
  const numFrames = Math.floor(sampleRate * durationSeconds);
  const buffer = audioContext.createBuffer(2, numFrames, sampleRate);

  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.getChannelData(1);

  // Tanpura overtone weights (Root Sa, Octave Sa, Fifth Pa, Target Swara)
  const harmonics = [
    { freq: saHz * 0.5, amp: 0.18, phase: 0 }, // Kharja (Low Sa)
    { freq: saHz, amp: 0.22, phase: 0.2 }, // Madhya Sa
    { freq: saHz * 1.5, amp: 0.14, phase: 0.5 }, // Pa (Fifth harmonic drone)
    { freq: saHz * 2.0, amp: 0.10, phase: 0.1 }, // Taar Sa
    // Target Swara (Ga / Pa / Ma) highlighted with vocal formant warmth
    { freq: targetHz, amp: 0.35, phase: 0.0 }, // Target Swar fundamental
    { freq: targetHz * 2, amp: 0.12, phase: 0.3 }, // 2nd Harmonic
    { freq: targetHz * 3, amp: 0.06, phase: 0.7 }, // 3rd Harmonic
  ];

  for (let i = 0; i < numFrames; i++) {
    const t = i / sampleRate;

    // Gentle 0.15 Hz tanpura acoustic chorusing / subtle jawari modulation
    const chorusing = 1.0 + 0.003 * Math.sin(2 * Math.PI * 0.15 * t);

    // Smooth looping envelope (raised cosine fade-in and fade-out at borders for gapless loop)
    let envelope = 1.0;
    const fadeDuration = 0.4; // 400ms fade at edges
    if (t < fadeDuration) {
      envelope = 0.5 * (1 - Math.cos((Math.PI * t) / fadeDuration));
    } else if (t > durationSeconds - fadeDuration) {
      const remaining = durationSeconds - t;
      envelope = 0.5 * (1 - Math.cos((Math.PI * remaining) / fadeDuration));
    }

    // Natural 5.5 Hz vocal vibrato / resonance pulse (very subtle, ±5 cents)
    const vibrato = 1.0 + 0.002 * Math.sin(2 * Math.PI * 5.5 * t);

    let sampleL = 0;
    let sampleR = 0;

    for (let h = 0; h < harmonics.length; h++) {
      const { freq, amp, phase } = harmonics[h];
      const modulatedFreq = freq * chorusing * (h >= 4 ? vibrato : 1.0);
      const angle = 2 * Math.PI * modulatedFreq * t + phase;

      // Slight stereo spread between odd and even harmonics
      if (h % 2 === 0) {
        sampleL += Math.sin(angle) * amp * 1.05;
        sampleR += Math.sin(angle) * amp * 0.95;
      } else {
        sampleL += Math.sin(angle) * amp * 0.95;
        sampleR += Math.sin(angle) * amp * 1.05;
      }
    }

    leftChannel[i] = sampleL * envelope * 0.65;
    rightChannel[i] = sampleR * envelope * 0.65;
  }

  return buffer;
}
