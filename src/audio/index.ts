export { AudioEngine } from './audio-engine';
export type { AudioEngineState, AudioEngineEvents, MicConstraints } from './audio-engine';

export { calibrateNoiseFloor } from './calibration';
export type { CalibrationResult, CalibrationConfig } from './calibration';

export { detectScale, buildChromaHistogram, frequencyToPitchClass } from './scale-detector';
export type { PitchFrame, ScaleDetectionResult, NoteName } from './scale-detector';

export {
  centError,
  centToAccuracy,
  frameAccuracy,
  computeEvalAccuracy,
  computeRollingAccuracy,
  evaluationGatePassed,
  getTargetFrequency,
  CONDITION_RATIOS,
  DEFAULT_ACCURACY_CONFIG,
} from './accuracy';
export type { Condition, AccuracyConfig } from './accuracy';
