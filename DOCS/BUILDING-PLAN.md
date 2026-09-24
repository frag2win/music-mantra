# Music Mantra — Building Plan

> Derived from [TRD-swara-healing-web.md](DOCS/TRD-swara-healing-web.md)
> **Target Stack:** Vite + React + TypeScript (frontend) · Node.js + PostgreSQL (backend)

---

## Phase 0 — Project Setup & DSP Core

**Goal:** Scaffold the project and prove the audio engine works in-browser.

### 0.1 Project Scaffold

| Task | Details |
| --- | --- |
| Init Vite + React + TypeScript project | `npx create-vite@latest ./ --template react-ts` |
| Install core dependencies | `xstate`, `vitest`, `playwright` |
| Set up folder structure | See [Folder Structure](#folder-structure) below |
| ESLint, Prettier, tsconfig strictness | Standard config |
| CI pipeline (GitHub Actions) | Lint → Type-check → Unit tests on every PR |

### 0.2 AudioWorklet YIN Pitch Tracker

| Task | Details |
| --- | --- |
| Implement YIN algorithm in an `AudioWorkletProcessor` | Window 2048, Hop 512, Range 70–800 Hz |
| Voiced/unvoiced classification | Aperiodicity ≤ 0.15 + RMS gate |
| 5-frame median filter on f0 | Smooth out jitter |
| Worklet ↔ main thread messaging | Posts `{ t, f0, conf }` via `MessagePort` |

### 0.3 Noise-Floor Calibration

| Task | Details |
| --- | --- |
| 3-second silence capture | Compute RMS distribution |
| Set adaptive noise gate | `gate = max(noise_p95 × 3, absolute_minimum)` |
| "Too noisy" user warning | If floor is above threshold |

### 0.4 Test Harness

| Task | Details |
| --- | --- |
| Synthetic tone generator (pure + harmonic-rich) | 100–800 Hz sweeps |
| Unit tests for YIN accuracy | Target: < 5 cents error (clean), < 10 cents (10 dB SNR) |
| Vibrato, glides, silence, noise robustness tests | No false voiced frames in silence/noise |

> **Phase 0 Deliverable:** A standalone page where you can grant mic access, see real-time f0 values, and run the synthetic test suite. This proves the entire DSP pipeline before any UI work begins.

---

## Phase 1 — Application Flow & UI Screens

**Goal:** Build the complete user journey with the state machine, all screens, and the accuracy metric — using fake/synthetic audio for testing.

### 1.1 XState State Machine

| State | Transitions |
| --- | --- |
| `WELCOME` | Accept disclaimer → `MIC_PERMISSION` |
| `MIC_PERMISSION` | Granted → `CALIBRATE`; Denied → `ERROR` |
| `CALIBRATE` | 3s done → `SING` |
| `SING` | ≥ 3s voiced (or 15s elapsed) → `SCALE_RESULT` |
| `SCALE_RESULT` | Confirm Sa (manual override available) → `MENU` |
| `MENU` | Select condition → `LISTEN` |
| `LISTEN` | Play/stop mantra loop; "Go Ahead" → `CHANT_EVAL` |
| `CHANT_EVAL` | Accuracy ≥ 90% → `CHANT_HOLD`; Below → `RETRY` |
| `RETRY` | Acknowledge → `LISTEN` |
| `CHANT_HOLD` | 10 min + ≥ 50% voiced → `SESSION_DONE` |
| `SESSION_DONE` | Home → `WELCOME` |
| Any state | Audio interruption → `PAUSED` (timer freezes) |

### 1.2 UI Screens (React Components)

| Screen | Key Elements |
| --- | --- |
| **Welcome** | Day N/45 progress ring, medical disclaimer modal, "Begin" button |
| **Calibrate** | Animated silence prompt, noise level meter |
| **Sing** | Live note display, 15s countdown, waveform visualization |
| **Scale Result** | Detected scale name, confidence %, note grid, Sa override picker |
| **Condition Menu** | 3 cards: Diabetes / Thyroid / Hypertension with Chakra visuals |
| **Listen** | Mantra audio player with play/stop, waveform, "Go Ahead" button |
| **Chant Eval** | Real-time pitch accuracy meter (≥ 4 updates/sec), rolling 2s display |
| **Chant Hold** | 10-minute countdown, voiced-time progress bar, accuracy readout |
| **Session Done** | Completion celebration, session stats, "See you tomorrow" message |
| **History** | Session list (date, condition, key, accuracy), day counter |

### 1.3 Scale Detection (Krumhansl–Schmuckler)

| Task | Details |
| --- | --- |
| 12-bin pitch-class histogram from voiced frames | A4 = 440 Hz reference |
| Correlate with 24 K-S major/minor profiles | Pearson r |
| Confidence display + low-confidence warning | Below r = 0.6 |
| Sa octave placement | Nearest to user's median sung pitch |
| `sa_hold` feature flag | Alternative: user holds one note for 4s |

### 1.4 Accuracy Metric

| Task | Details |
| --- | --- |
| Cent error formula (octave-invariant) | `e = ((1200·log₂(f0/T) mod 1200) + 1800) mod 1200 − 600` |
| Accuracy score | `a = max(0, 100 − 0.5· | e | )` |
| Evaluation gate | Mean accuracy over first 7.5s of voiced frames |
| Live display | Rolling 2s mean, updated ≥ 4×/s |

### 1.5 Playwright E2E Tests

| Task | Details |
| --- | --- |
| Chromium `--use-fake-device-for-media-stream` | Inject pre-recorded WAV as mic input |
| Happy path: pass evaluation → complete 10-min hold | Automated |
| Retry path: fail evaluation → re-listen → pass | Automated |

> **Phase 1 Deliverable:** The entire app flow is navigable end-to-end. A user (or Playwright bot) can walk through every screen. Audio uses synthetic/fake sources. No backend yet — session data stored in memory.

---

## Phase 2 — Backend, Auth, Content & Polish

**Goal:** Add server persistence, authentication, mantra audio files, and platform hardening.

### 2.1 Backend API (Node.js + TypeScript)

| Endpoint | Purpose |
| --- | --- |
| `POST /auth/magic-link` | Send passwordless sign-in email |
| `POST /auth/verify` | Verify magic link token, return JWT |
| `GET /user/profile` | Get user settings, disclaimer status |
| `DELETE /user` | Delete account and ALL data |
| `GET /user/export` | Export all user data as JSON |
| `GET /programs` | List user's programs |
| `POST /programs` | Create new 45-day program |
| `GET /sessions` | List sessions for active program |
| `POST /sessions` | Record completed session |

### 2.2 PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  locale        TEXT DEFAULT 'en',
  reminder_time TIME,
  disclaimer_accepted_at TIMESTAMPTZ,
  consent_version INTEGER DEFAULT 1
);

-- Programs table (one active per user)
CREATE TABLE programs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  condition   TEXT NOT NULL CHECK (condition IN ('diabetes','thyroid','hypertension')),
  started_at  TIMESTAMPTZ DEFAULT now(),
  tuning      TEXT DEFAULT 'just',
  active      BOOLEAN DEFAULT true
);

-- Sessions table
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID REFERENCES programs(id) ON DELETE CASCADE,
  day_index       INTEGER NOT NULL,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  sa_pc           TEXT,
  sa_hz           REAL,
  eval_accuracy   REAL,
  mean_accuracy   REAL,
  voiced_seconds  REAL,
  completed       BOOLEAN DEFAULT false,
  app_version     TEXT
);
```

### 2.3 Mantra Audio Content

| Task | Details |
| --- | --- |
| Record 72 mantra files | 3 conditions × 12 Sa pitch classes × 2 registers |
| Master format | 48 kHz mono 24-bit WAV |
| Delivery format | AAC (.m4a) for universal browser support |
| CDN path | `/mantras/<condition>/<sa>-<register>.m4a` |
| Manifest JSON | Version + SHA-256 per file for cache validation |
| CI pitch QA script | Measure sustained pitch; fail build if | error | > 5 cents |
| Dev fallback | Synthesized tones until recordings are ready |

### 2.4 Platform Hardening

| Task | Details |
| --- | --- |
| Screen Wake Lock API | Active during LISTEN, CHANT_EVAL, CHANT_HOLD states |
| `AudioContext` resume on user gesture | Required for iOS Safari |
| Bluetooth headset detection | Warn if sample rate < 16 kHz |
| Half-duplex enforcement | Never play mantra while mic is analyzing |
| Session interruption handling | Tab kill / phone call → PAUSED → resume or discard |
| Daily email reminders (opt-in) | User's chosen local time; plus downloadable .ics calendar |

> **Phase 2 Deliverable:** Fully functional app with real authentication, server-stored sessions, mantra playback (synth fallback if recordings aren't ready), and platform-specific hardening. Deployable to a staging environment.

---

## Phase 3 — Beta Testing

**Goal:** Real-world validation with 15–20 users across devices.

### 3.1 Beta Deployment

| Task | Details |
| --- | --- |
| Deploy frontend to CDN (Vercel / Cloudflare Pages) | HTTPS, India-region edge |
| Deploy backend to cloud (Railway / Render / AWS) | India-region hosting |
| PostgreSQL managed instance | Encrypted at rest |

### 3.2 Device Testing Matrix

| Device | Browser | Priority |
| --- | --- | --- |
| Low-end Android phone | Chrome | 🔴 Critical |
| Mid-range Android phone | Chrome | 🔴 Critical |
| iPhone (recent) | Safari | 🔴 Critical |
| iPhone (recent) | Chrome-on-iOS | 🟡 High |
| Windows laptop | Chrome / Edge | 🟡 High |
| Mac laptop | Safari / Chrome | 🟡 High |
| Wired USB mic | Any | 🟢 Medium |
| Bluetooth headset | Any | 🟢 Medium |

### 3.3 Data Collection & Threshold Tuning

| Task | Details |
| --- | --- |
| Collect key-detection corpus | ≥ 100 real recordings from beta users |
| Measure top-1 key detection accuracy | Target ≥ 85%; fallback to `sa_hold` |
| Tune pass threshold | Default 90%, adjust based on real data |
| Tune eval voiced seconds | Default 7.5s |
| Measure day-7 and day-45 retention | Inform reminder strategy |

> **Phase 3 Deliverable:** A tested beta with real user feedback, a validated device matrix, confirmed key-detection accuracy, and tuned thresholds.

---

## Phase 4 — Launch Prep & Release

### 4.1 Compliance & Legal

| Task | Details |
| --- | --- |
| DPDP Act 2023 compliance review | Consent flows, data minimisation, breach process |
| Medical disclaimer wording | Legal review (CDSCO exposure) |
| Age gate (18+ self-declaration) | Required before sign-up |
| CSP headers | Strict `script-src 'self'`, no third-party scripts |

### 4.2 Accessibility Audit (WCAG 2.1 AA)

| Task | Details |
| --- | --- |
| Pitch meter uses position + text, not colour alone | Verified |
| `aria-live` rate-limited accuracy announcements | Implemented |
| Keyboard navigation for all interactive elements | Tested |
| Screen reader compatibility | Tested with VoiceOver + TalkBack |

### 4.3 i18n

| Task | Details |
| --- | --- |
| All UI strings externalized | JSON locale files |
| English launch | Default |
| Hindi + Marathi | Next release |

### 4.4 Production Deployment

| Task | Details |
| --- | --- |
| Final performance audit | First load < 3s on 4G |
| Domain + SSL setup | HTTPS only |
| Monitoring + error tracking | Sentry or equivalent |
| Go live 🚀 | |

---

## Folder Structure

```
music-mantra/
├── DOCS/
│   └── TRD-swara-healing-web.md
├── src/
│   ├── audio/
│   │   ├── worklets/
│   │   │   └── yin-processor.ts        # AudioWorklet YIN pitch tracker
│   │   ├── calibration.ts              # Noise-floor calibration
│   │   ├── scale-detector.ts           # K-S key detection
│   │   ├── accuracy.ts                 # Cent error & accuracy metric
│   │   └── audio-engine.ts             # Mic capture & mantra player orchestration
│   ├── machine/
│   │   └── app-machine.ts              # XState state machine definition
│   ├── components/
│   │   ├── Welcome.tsx
│   │   ├── Calibrate.tsx
│   │   ├── Sing.tsx
│   │   ├── ScaleResult.tsx
│   │   ├── ConditionMenu.tsx
│   │   ├── Listen.tsx
│   │   ├── ChantEval.tsx
│   │   ├── ChantHold.tsx
│   │   ├── SessionDone.tsx
│   │   ├── History.tsx
│   │   └── common/                     # Shared UI components (meters, buttons, etc.)
│   ├── api/
│   │   └── client.ts                   # REST API client
│   ├── i18n/
│   │   ├── en.json
│   │   ├── hi.json
│   │   └── mr.json
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── server/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── programs.ts
│   │   └── sessions.ts
│   ├── db/
│   │   ├── schema.sql
│   │   └── queries.ts
│   ├── email/
│   │   ├── magic-link.ts
│   │   └── reminders.ts
│   └── index.ts
├── public/
│   └── mantras/
│       ├── diabetes/
│       ├── thyroid/
│       └── hypertension/
├── tests/
│   ├── unit/                           # Vitest: DSP, metric, state machine
│   └── e2e/                            # Playwright: full flow with fake audio
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## Key Decisions Needed Before Building

| # | Decision | Blocks | Default |
| --- | --- | --- | --- |
| 1 | Individual users vs. clinic-managed? | Phase 2 auth design | Individual with email sign-in |
| 2 | Who records the 72 mantra files? | Phase 2 content | Synth fallback until recordings ready |
| 3 | Just intonation vs. equal temperament? | Phase 0 accuracy metric | Just intonation (single config flag) |
| 4 | Sign-in required vs. optional local-only mode? | Phase 2 backend | Sign-in required (browser storage unreliable) |
