# 📋 Implementation Report — Phase 0: DSP Core

> **Project:** Music Mantra — Swara Healing (Web)
> **Phase:** 0 — Project Setup & DSP Core
> **Date:** 24 September 2026
> **Author:** Shubham Pawar (frag2win)
> **Status:** ✅ Complete

---

## 1. Objective

Establish the project foundation and implement the complete client-side audio Digital Signal Processing (DSP) pipeline, proving that real-time pitch detection, noise calibration, scale/key identification, and chanting accuracy scoring all work correctly in a browser environment — before any UI design or backend work begins.

---

## 2. Technology Stack Implemented

| Layer | Technology | Version |
|---|---|---|
| Build Tool | Vite | ^8.3.0 |
| Language | TypeScript | ~6.0.2 |
| UI Framework | React | ^19.2.8 |
| Unit Testing | Vitest | ^5.0.1 |
| Linter | OxLint | ^1.81.0 |
| Package Manager | npm | — |

---

## 3. Modules Implemented

### 3.1 YIN Pitch Tracker (`src/audio/worklets/yin-processor.ts`)

The core pitch detection algorithm, running entirely inside an `AudioWorkletProcessor` thread.

**Algorithm Steps:**
1. **Difference Function** — Computes `d(τ) = Σ(x[j] − x[j+τ])²` for each lag τ
2. **Cumulative Mean Normalized Difference (CMND)** — Normalizes the difference function to remove amplitude dependency
3. **Absolute Threshold** — Finds the first lag where `d'(τ) < 0.15` (aperiodicity threshold) within the search range
4. **Parabolic Interpolation** — Refines the lag estimate to sub-sample accuracy
5. **5-Frame Median Filter** — Smooths consecutive f0 estimates to reduce jitter

**Parameters:**
| Parameter | Value |
|---|---|
| Window Size | 2048 samples |
| Hop Size | 512 samples |
| Search Range | 70 Hz – 800 Hz |
| Aperiodicity Threshold | 0.15 |
| Median Filter Size | 5 frames |

**Output:** Posts `{ t, f0, conf }` messages to the main thread via `MessagePort`. The main thread never accesses raw audio samples.

---

### 3.2 Noise-Floor Calibration (`src/audio/calibration.ts`)

Captures 3 seconds of ambient silence before voice detection to set an adaptive noise gate.

**Process:**
1. Capture microphone input for 3 seconds
2. Compute RMS energy for each analysis frame
3. Sort RMS values and extract the 95th percentile (p95)
4. Compute gate: `noiseGate = max(noise_p95 × 3, 0.0005)`
5. Flag environment as "too noisy" if `noise_p95 > 0.05`

**Outputs:** `CalibrationResult` containing `noiseGate`, `noiseP95`, `noiseMean`, `tooNoisy`, and `durationSeconds`.

---

### 3.3 Scale Detector — Krumhansl–Schmuckler (`src/audio/scale-detector.ts`)

Identifies the musical key (tonic / Sa) from captured singing using a well-established musicological algorithm.

**Process:**
1. Convert all voiced f0 frames to pitch classes (0–11, where 0 = C, referenced to A4 = 440 Hz)
2. Build a 12-bin chroma histogram, weighting each frame by its confidence score
3. Normalize the histogram
4. For each of 12 possible tonics × 2 modes (major/minor) = 24 candidates:
   - Rotate the histogram to place the candidate tonic at index 0
   - Compute Pearson correlation against the Krumhansl–Schmuckler key profile
5. Select the candidate with the highest correlation as the detected key
6. Place Sa in the octave nearest the user's median sung pitch

**Outputs:** `ScaleDetectionResult` containing `tonic`, `mode`, `confidence`, `runnerUp`, `lowConfidence` flag (below r = 0.6), `saFrequency`, and the raw `chromaHistogram`.

---

### 3.4 Accuracy Metric (`src/audio/accuracy.ts`)

Computes how accurately the user chants relative to the target frequency for their selected health condition.

**Target Frequency:**
```
T = Sa × ratio(condition)
```

| Condition | Ratio | Cents above Sa |
|---|---|---|
| Diabetes (Ga/Ram) | 5/4 = 1.25 | 386.3 |
| Thyroid (Pa/Ham) | 3/2 = 1.50 | 702.0 |
| Hypertension (Ma/Yam) | 4/3 ≈ 1.333 | 498.0 |

**Cent Error Formula (octave-invariant):**
```
e = ((1200 · log₂(f0 / T) mod 1200) + 1800) mod 1200 − 600
```

**Accuracy Score:**
```
a = max(0, 100 − 0.5 · |e|)
```

| Cent Error | Accuracy |
|---|---|
| 0 cents | 100% |
| 20 cents | 90% |
| 100 cents | 50% |
| 200 cents | 0% |

**Modes:**
- **Evaluation Gate** — Mean accuracy over the first 7.5s of voiced frames (after discarding 1s onset transient). Must reach ≥ 90% to proceed.
- **Rolling Display** — Mean accuracy over a sliding 2-second window, updated ≥ 4×/s.

---

### 3.5 Audio Engine Orchestrator (`src/audio/audio-engine.ts`)

Central module that ties all audio components together and enforces application-level constraints.

**Responsibilities:**
- Microphone access via `getUserMedia` with explicit constraint requests (`echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`)
- Logging whether constraints were honored by the browser
- Loading and connecting the YIN AudioWorklet
- Managing noise-floor calibration
- Loading and playing mantra audio files (decoded `AudioBuffer`, gapless loop)
- **Half-duplex enforcement:** Never plays mantra audio while the microphone is actively analysing
- Clean resource teardown (stop tracks, close AudioContext)

**States:** `idle` → `requesting-mic` → `calibrating` → `listening` / `playing` → `error`

---

### 3.6 DSP Test Harness UI (`src/components/DspTestHarness.tsx`)

An interactive React page for visually verifying the entire audio pipeline.

**Sections:**
1. **Microphone Access** — Request permission, display device settings
2. **Noise-Floor Calibration** — Run 3s calibration, display gate values and environment status
3. **Live Pitch Detection** — Start/stop YIN worklet, display real-time f0, confidence, and voiced frame counts
4. **Scale & Sa Detection** — Run K-S algorithm on captured frames, display detected key, confidence, runner-up, and a visual chroma histogram
5. **Live Accuracy Test** — Select a condition, display real-time cent error and accuracy percentage

---

## 4. Test Results

**Test Framework:** Vitest v5.0.1
**Total Tests:** 43 passing (0 failing)

### 4.1 Accuracy Metric Tests (28 tests)
| Suite | Tests | Status |
|---|---|---|
| `centError` | 7 | ✅ Pass |
| `centToAccuracy` | 6 | ✅ Pass |
| `frameAccuracy` | 3 | ✅ Pass |
| `getTargetFrequency` | 3 | ✅ Pass |
| `CONDITION_RATIOS` | 3 | ✅ Pass |
| `computeEvalAccuracy` | 3 | ✅ Pass |
| `evaluationGatePassed` | 3 | ✅ Pass |

**Key validations:**
- Octave invariance: `centError(880, 440) = 0 cents` ✅
- Monotonicity: accuracy decreases monotonically with increasing |cents| ✅
- Onset transient discarding: first 1s of off-pitch frames ignored ✅
- Evaluation gate: passes at ≥ 90% accuracy + ≥ 7.5s voiced ✅
- Just intonation ratios: Diabetes = 5/4, Thyroid = 3/2, Hypertension = 4/3 ✅

### 4.2 Scale Detector Tests (15 tests)
| Suite | Tests | Status |
|---|---|---|
| `frequencyToPitchClass` | 5 | ✅ Pass |
| `buildChromaHistogram` | 3 | ✅ Pass |
| `detectScale` | 7 | ✅ Pass |

**Key validations:**
- Pitch class mapping: A4 (440 Hz) → 9, C4 (261.63 Hz) → 0 ✅
- Key detection: C major, A major, G major all correctly identified ✅
- Confidence: uniform input produces lower correlation than tonal input ✅
- Runner-up key always returned with lower confidence ✅

---

## 5. Project Structure (Phase 0)

```
music-mantra/
├── DOCS/
│   ├── TRD-swara-healing-web.md        # Technical Requirements Document
│   ├── BUILDING-PLAN.md                # Phased building plan
│   └── IMPLEMENTATION-REPORT.md        # This document
├── src/
│   ├── audio/
│   │   ├── worklets/
│   │   │   └── yin-processor.ts        # AudioWorklet YIN pitch tracker
│   │   ├── calibration.ts              # Noise-floor calibration
│   │   ├── scale-detector.ts           # K-S key detection
│   │   ├── accuracy.ts                 # Cent error & accuracy metric
│   │   ├── audio-engine.ts             # Orchestrator
│   │   └── index.ts                    # Barrel exports
│   ├── components/
│   │   └── DspTestHarness.tsx          # Interactive DSP test UI
│   ├── App.tsx                         # Root component (renders test harness)
│   └── main.tsx                        # Entry point
├── tests/
│   └── unit/
│       ├── accuracy.test.ts            # 28 tests
│       └── scale-detector.test.ts      # 15 tests
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 6. Design Decisions & Rationale

| Decision | Rationale |
|---|---|
| YIN over FFT-based pitch detection | YIN is more robust for monophonic vocal pitch, handles harmonics correctly, and gives aperiodicity (confidence) for free |
| AudioWorklet over ScriptProcessor | ScriptProcessor is deprecated; AudioWorklet runs in a separate thread, avoiding main-thread jank |
| Just intonation (not equal temperament) | Matches the TRD specification; 13.7-cent difference for Ga (5/4 vs 400 cents) is significant within the 20-cent tolerance |
| Octave-invariant accuracy metric | Users may naturally sing an octave above or below; the cent error formula wraps at octave boundaries |
| Noise gate from p95 × 3 (not mean) | The 95th percentile captures transient noise spikes; the 3× multiplier provides headroom above the noise floor |
| Half-duplex audio (no simultaneous play + capture) | Without confirmed headphone isolation, playback leaks into the mic and corrupts pitch detection |

---

## 7. Known Limitations (Phase 0)

| # | Limitation | Resolution |
|---|---|---|
| 1 | No browser-based tests for AudioWorklet (requires real browser APIs) | Playwright E2E tests planned for Phase 1 |
| 2 | Mantra playback uses synthesized fallback (no real recordings yet) | Real recordings required before Phase 2 |
| 3 | Scale detection accuracy not validated against real-world singing corpus | Beta corpus collection planned for Phase 3 |
| 4 | `sa_hold` alternative flow not yet implemented | Feature-flagged; evaluate against song flow in beta |

---

## 8. Next Steps → Phase 1

Phase 1 will build on this DSP foundation to implement:
- XState state machine (full application flow)
- All 10 UI screens (Welcome through Session Done)
- Playwright end-to-end tests with fake audio capture
- Integration of scale detection + accuracy into the live chanting flow

Refer to [BUILDING-PLAN.md](BUILDING-PLAN.md) for the full Phase 1 scope.
