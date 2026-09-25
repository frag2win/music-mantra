import React from 'react';

export interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
}

const defaultProps = (props: IconProps) => ({
  width: props.size ?? 18,
  height: props.size ?? 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: props.color ?? 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: props.className,
  style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...props.style },
  'aria-hidden': props['aria-hidden'] ?? true,
});

/** Lotus / Meditation Icon (App Branding & Neutral) */
export const LotusIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)} viewBox="0 0 24 24">
    <path d="M12 3c-1.5 3-4.5 6-4.5 9 0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5c0-3-3-6-4.5-9z" />
    <path d="M7.5 12c-2.5-1-5.5.5-5.5 3.5 0 2.5 3 4.5 6 4.5 1.5 0 3-.5 4-1.5" />
    <path d="M16.5 12c2.5-1 5.5.5 5.5 3.5 0 2.5-3 4.5-6 4.5-1.5 0-3-.5-4-1.5" />
    <path d="M12 16.5v4.5" />
  </svg>
);

/** Beaker / Lab Flask (Feedback) */
export const FlaskIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <path d="M10 2v5l-5 9.5A2 2 0 0 0 6.8 20h10.4a2 2 0 0 0 1.8-3.5L14 7V2" />
    <line x1="8.5" y1="2" x2="15.5" y2="2" />
    <path d="M7 15h10" />
  </svg>
);

/** User Silhouette (Account) */
export const UserIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/** Key (Sign In) */
export const KeyIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <path d="M21 2l-2 2m-1.5 1.5L14 9l-2-2 2-2 1.5-1.5z" />
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="M15.5 7.5L14 9l3 3 2-2-1.5-1.5 2-2-1.5-1.5z" />
  </svg>
);

/** Wrench / Tools (DSP Harness) */
export const WrenchIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

/** Scales of Justice / Medical Balance */
export const ScaleIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <path d="M12 3v18" />
    <path d="M6 7l6-3 6 3" />
    <path d="M4 14l2-7 2 7a2 2 0 0 1-4 0z" />
    <path d="M16 14l2-7 2 7a2 2 0 0 1-4 0z" />
    <path d="M9 21h6" />
  </svg>
);

/** Sun / Radiant Solar Core (Manipura / Diabetes) */
export const SunIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

/** Leaf / Heart Harmony (Anahata / Hypertension) */
export const LeafIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <path d="M11 20A7 7 0 0 1 4 13a8 8 0 0 1 8-8c5 0 8 4 8 8a7 7 0 0 1-7 7z" />
    <path d="M12 5v15" />
  </svg>
);

/** Sound / Acoustic Wave (Vishuddha / Thyroid) */
export const WaveIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <path d="M2 12c2.5 0 2.5-6 5-6s2.5 12 5 12 2.5-12 5-12 2.5 6 5 6" />
  </svg>
);

/** Warning Triangle */
export const AlertTriangleIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/** Check Circle (Success) */
export const CheckCircleIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

/** Simple Checkmark */
export const CheckIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/** Download / Export */
export const DownloadIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/** Trash / Delete */
export const TrashIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

/** Lightning Bolt / Fast Action */
export const BoltIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

/** Close / X */
export const CloseIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/** Calendar Card (.ics download) */
export const CalendarIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/** Microphone (Studio / Broadcast) */
export const MicIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

/** Globe (Language Switcher) */
export const GlobeIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

/** Target / Bullseye (Target Swara / Accuracy) */
export const TargetIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

/** Musical Note (Audio Playback) */
export const MusicNoteIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

/** Padlock (Half-duplex security) */
export const LockIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/** Clock / Timer */
export const ClockIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/** Star (In-Tune / Harmonic Lock / Rating) */
export const StarIcon: React.FC<IconProps & { filled?: boolean }> = ({ filled, ...props }) => (
  <svg {...defaultProps(props)} fill={filled ? (props.color ?? 'currentColor') : 'none'}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/** Sparkles / Celebration (Completion) */
export const SparklesIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
  </svg>
);

/** Info Badge */
export const InfoIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/** Smartphone (Device Diagnostics) */
export const SmartphoneIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

/** Play Triangle (Audio Playback) */
export const PlayIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)} fill="currentColor">
    <polygon points="6 4 19 12 6 20 6 4" />
  </svg>
);

/** Stop Square (Audio Playback Stop) */
export const StopIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)} fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" ry="2" />
  </svg>
);

/** Arrow Up (Pitch adjustment) */
export const ArrowUpIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

/** Arrow Down (Pitch adjustment) */
export const ArrowDownIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps(props)}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);


