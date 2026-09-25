# 📜 Changelog — Music Mantra (Swara Healing)

> A human-readable, annotated history of every significant change in this project.
> Each entry documents **what** changed, **why** it was done, **which files** were affected, and **what to look at next**.

---

## Phase 1: Application Flow & UI Implementation
**Date:** 25 Sep 2026
**Author:** Antigravity AI

### Summary
Implemented the complete Phase 1 application flow as specified in [TRD-swara-healing-web.md](DOCS/TRD-swara-healing-web.md) and [BUILDING-PLAN.md](DOCS/BUILDING-PLAN.md). Built the XState v5 application state machine, 10 UI screens, accessible pitch meter component, domain types, and Playwright end-to-end testing suite.

### What Changed

#### ⚙️ Application State Machine (`src/machine/app-machine.ts`)
- Defined 13 explicit application states (`welcome`, `mic_permission`, `calibrate`, `sing`, `scale_result`, `menu`, `listen`, `chant_eval`, `retry`, `chant_hold`, `retry_short`, `session_done`, `history`, `paused`).
- Enforced medical disclaimer guard condition before starting program.
- Managed session counters, active day index (1..45), manual Sa overrides, and history array persistence.

#### 🎨 UI Screen Components (`src/components/`)
| File | Screen / Role |
|---|---|
| `Welcome.tsx` | Welcome screen with Day N/45 progress ring, medical disclaimer modal (FR-1), and Begin/History buttons |
| `Calibrate.tsx` | 3-second ambient noise calibration screen with animated progress bar and noise level meter |
| `Sing.tsx` | Key capture screen with 15-second countdown, live pitch readout, and ≥3s voiced frames gate (FR-2) |
| `ScaleResult.tsx` | Detected scale & tonic (Sa) display, confidence level, 12-note manual Sa override picker, and `sa_hold` toggle (FR-3) |
| `ConditionMenu.tsx` | 3 Chakra condition cards: Diabetes (Manipura/Ga/Ram), Thyroid (Vishuddha/Pa/Ham), Hypertension (Anahata/Ma/Yam) (FR-4) |
| `Listen.tsx` | Reference mantra loop player with half-duplex safety guarantee (FR-5 & FR-6) |
| `ChantEval.tsx` | 7.5-second evaluation gate screen with rolling 2s accuracy display (≥90% pass target) (FR-7 & FR-8) |
| `ChantHold.tsx` | 10-minute hold countdown timer with screen wake lock and ≥50% (300s) voiced time accounting (FR-9) |
| `SessionDone.tsx` | Session completion celebration screen with FR-10 requirement copy and session statistics |
| `History.tsx` | Session history log table with date, condition, Sa key, and evaluation/mean accuracy (FR-11) |
| `Retry.tsx` & `RetryShort.tsx` | Retry prompt screens for evaluation failure and insufficient voiced time |
| `common/PitchMeter.tsx` | WCAG 2.1 AA accessible visual pitch accuracy meter with target/sung note, cent gauge, and rate-limited `aria-live` region |

#### 🧪 Tests & Build Validation
- Unit tests: Added `tests/unit/app-machine.test.ts` (6 tests). Total 55 passing Vitest unit tests.
- E2E tests: Added `tests/e2e/app-flow.spec.ts` and `playwright.config.ts` for Chromium fake-audio testing.
- Type Safety & Linting: Clean TypeScript `tsc -b` compilation and 0 OxLint errors.

---

## [4672047] — Phase 0: DSP Core Implementation
**Date:** 24 Sep 2026, 22:52 IST
**Author:** Shubham Pawar

### Summary
Scaffolded the entire Vite + React + TypeScript project and implemented the complete client-side audio DSP pipeline: YIN pitch tracker, noise calibration, Krumhansl–Schmuckler scale detection, chanting accuracy metric, audio engine orchestrator, and an interactive DSP test harness. All 43 unit tests passing.

### What Changed

#### 🏗️ Project Scaffold
- Initialized Vite + React + TypeScript project with OxLint
- Configured Vitest for unit testing
- Set up AudioWorklet-compatible worker format in Vite config

#### 🎵 Audio DSP Modules (New)
| File | Purpose |
|---|---|
| `src/audio/worklets/yin-processor.ts` | YIN pitch detection algorithm in AudioWorklet (window 2048, hop 512, range 70–800 Hz, 5-frame median filter) |
| `src/audio/calibration.ts` | 3-second noise-floor calibration (p95 × 3 adaptive gate) |
| `src/audio/scale-detector.ts` | Krumhansl–Schmuckler key-finding: 12-bin chroma histogram, Pearson correlation against 24 major/minor profiles |
| `src/audio/accuracy.ts` | Octave-invariant cent error formula, per-frame accuracy scoring, evaluation gate (≥90% over 7.5s), rolling 2s display window |
| `src/audio/audio-engine.ts` | Orchestrator: mic capture, YIN worklet connection, calibration, mantra playback (gapless loop), half-duplex enforcement |
| `src/audio/index.ts` | Barrel exports for clean imports |

#### 🖥️ UI
| File | Purpose |
|---|---|
| `src/components/DspTestHarness.tsx` | Interactive 5-section test page: mic access, calibration, live f0 display, scale detection with chroma histogram, accuracy scoring |
| `src/App.tsx` | Root component — renders DSP Test Harness |

#### ✅ Tests (New)
| File | Tests |
|---|---|
| `tests/unit/accuracy.test.ts` | 28 tests — cent error, octave invariance, monotonicity, onset discarding, evaluation gate |
| `tests/unit/scale-detector.test.ts` | 15 tests — pitch-class mapping, chroma histogram, C/A/G major detection, runner-up |

### Impact
- **28 new files** added, **4,141 lines** inserted
- Foundation for all future phases — the DSP engine is proven and tested

---

## [f42200f] — Add Building Plan
**Date:** 24 Sep 2026, 22:39 IST
**Author:** Shubham Pawar

### Summary
Created a comprehensive phased building plan covering all 5 phases (Phase 0 through Phase 4), including the complete folder structure, API endpoint specifications, PostgreSQL schema, device testing matrix, and key pre-build decisions.

### What Changed
| File | Change |
|---|---|
| `DOCS/BUILDING-PLAN.md` | New — 355 lines covering Phase 0 (DSP Core), Phase 1 (App Flow), Phase 2 (Backend + Content), Phase 3 (Beta Testing), Phase 4 (Launch) |

### Impact
- Establishes the roadmap for the entire project
- Documents all key technical decisions and their defaults

---

## [f128e23] — Organize Project Documentation
**Date:** 24 Sep 2026, 22:11 IST
**Author:** Shubham Pawar

### Summary
Created a `DOCS/` folder and moved the Technical Requirements Document into it. Updated all relative links in README.md to reflect the new path.

### What Changed
| File | Change |
|---|---|
| `TRD-swara-healing-web.md` | Moved → `DOCS/TRD-swara-healing-web.md` |
| `README.md` | Updated badge links from `TRD-swara-healing-web.md` → `DOCS/TRD-swara-healing-web.md` |

### Rationale
Separating documentation from source code keeps the root directory clean and establishes a convention for all future documents.

---

## [916d23b] — Add Technical Requirements Document
**Date:** 24 Sep 2026, 22:08 IST
**Author:** Shubham Pawar

### Summary
Added the full Technical Requirements Document (TRD) specifying every functional requirement, non-functional requirement, audio/DSP specification, application state machine, data model, security/privacy requirements, testing criteria, and risk register.

### What Changed
| File | Change |
|---|---|
| `TRD-swara-healing-web.md` | New — 175 lines, 14 sections covering the complete v1 specification |

### Key Sections
- **§2** Condition → Mantra mapping (Diabetes/Thyroid/Hypertension)
- **§3** 13 Functional Requirements (FR-1 through FR-13)
- **§6** Audio DSP specification (YIN, calibration, K-S detection, accuracy metric)
- **§7** Application state machine (12 states)
- **§8** PostgreSQL data model (user, program, session)
- **§11** DPDP Act 2023 compliance requirements
- **§14** 9 open risks and decisions

---

## [ba45856] — Create Comprehensive README
**Date:** 24 Sep 2026, 22:08 IST
**Author:** Shubham Pawar

### Summary
Replaced the initial single-line README with a comprehensive project README containing the full project overview, architecture diagram (Mermaid), feature list, DSP specifications, state flow diagram, data model documentation, platform compatibility matrix, and security/compliance summary.

### What Changed
| File | Change |
|---|---|
| `README.md` | Expanded from 1 line → 175 lines with badges, ToC, architecture diagram, and detailed sections |

---

## [a9684d5] — First Commit
**Date:** 24 Sep 2026, 22:03 IST
**Author:** Shubham Pawar

### Summary
Repository initialized with a basic README heading.

### What Changed
| File | Change |
|---|---|
| `README.md` | New — `# music-mantra` |

---

## Document Index

All project documentation lives in the [`DOCS/`](../DOCS/) folder:

| Document | Purpose |
|---|---|
| [TRD-swara-healing-web.md](TRD-swara-healing-web.md) | Technical Requirements Document — the source of truth for all product and technical specifications |
| [BUILDING-PLAN.md](BUILDING-PLAN.md) | Phased building plan — roadmap for Phase 0 through Phase 4 |
| [IMPLEMENTATION-REPORT.md](IMPLEMENTATION-REPORT.md) | Detailed implementation report for completed phases |
| [CHANGELOG.md](CHANGELOG.md) | This file — annotated project history |
