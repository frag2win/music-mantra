import React from 'react';
import './LotusIntro.css';

/**
 * LotusIntro — Cinematic site-entry animation.
 *
 * Displays a dark spiritual background with falling petal particles,
 * then a multi-layered SVG lotus blooms open at center with radiance
 * and water reflections. Finally the lotus expands to fill the screen
 * and fades into the dashboard.
 *
 * Uses `sessionStorage` so it only plays on the first tab open—never
 * on refresh, navigation, or new-tab reuse.
 */

const SESSION_KEY = 'swara__lotus_intro_played';
const TOTAL_DURATION_MS = 8600; // petals + bloom + expand + fade
const EXPAND_START_MS = 6600;  // when the lotus starts expanding

/* ------------------------------------------------------------------ */
/*  Falling Petal SVG — a small organic petal shape                    */
/* ------------------------------------------------------------------ */
const PetalSvg: React.FC<{ hue: number }> = ({ hue }) => (
  <svg viewBox="0 0 20 28" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`pg${hue}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={`hsl(${hue}, 55%, 50%)`} stopOpacity="0.9" />
        <stop offset="100%" stopColor={`hsl(${hue + 15}, 45%, 35%)`} stopOpacity="0.7" />
      </linearGradient>
    </defs>
    <path
      d="M10 0 C6 6, 0 12, 2 20 C4 26, 8 28, 10 28 C12 28, 16 26, 18 20 C20 12, 14 6, 10 0Z"
      fill={`url(#pg${hue})`}
      stroke={`hsl(${hue}, 40%, 30%)`}
      strokeWidth="0.4"
    />
    {/* Vein line */}
    <path
      d="M10 3 Q9 14, 10 26"
      fill="none"
      stroke={`hsl(${hue}, 35%, 40%)`}
      strokeWidth="0.3"
      opacity="0.5"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Generate random falling petals                                     */
/* ------------------------------------------------------------------ */
interface FallingPetal {
  id: number;
  left: string;
  size: number;
  duration: number;
  delay: number;
  sway: string;
  swayEnd: string;
  hue: number;
}

function generatePetals(count: number): FallingPetal[] {
  const petals: FallingPetal[] = [];
  for (let i = 0; i < count; i++) {
    const hue = 330 + Math.random() * 40; // pink-maroon range (330-370 → wraps to red)
    petals.push({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      size: 10 + Math.random() * 18,
      duration: 4 + Math.random() * 4,
      delay: Math.random() * 3.5,
      sway: `${(Math.random() - 0.5) * 80}px`,
      swayEnd: `${(Math.random() - 0.5) * 60}px`,
      hue: Math.round(hue) % 360,
    });
  }
  return petals;
}

/* ------------------------------------------------------------------ */
/*  Generate pollen / dust particles around the bloom                  */
/* ------------------------------------------------------------------ */
interface PollenDot {
  id: number;
  top: string;
  left: string;
  dur: number;
  delay: number;
  dx: string;
  dy: string;
  dx2: string;
  dy2: string;
}

function generatePollen(count: number): PollenDot[] {
  const dots: PollenDot[] = [];
  for (let i = 0; i < count; i++) {
    dots.push({
      id: i,
      top: `${30 + Math.random() * 40}%`,
      left: `${20 + Math.random() * 60}%`,
      dur: 3 + Math.random() * 3,
      delay: 4.5 + Math.random() * 2,
      dx: `${(Math.random() - 0.5) * 50}px`,
      dy: `${-10 - Math.random() * 50}px`,
      dx2: `${(Math.random() - 0.5) * 40}px`,
      dy2: `${-30 - Math.random() * 40}px`,
    });
  }
  return dots;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export const LotusIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = React.useState<'playing' | 'expanding' | 'fading' | 'done'>('playing');

  const petals = React.useMemo(() => generatePetals(35), []);
  const pollen = React.useMemo(() => generatePollen(12), []);

  React.useEffect(() => {
    // Start the expansion phase
    const expandTimer = setTimeout(() => {
      setPhase('expanding');
    }, EXPAND_START_MS);

    // Start the fade-out
    const fadeTimer = setTimeout(() => {
      setPhase('fading');
    }, TOTAL_DURATION_MS - 800);

    // Complete & unmount
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, TOTAL_DURATION_MS);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div className={`lotus-intro-overlay ${phase === 'fading' ? 'fade-out' : ''}`}>
      {/* Falling petal particles */}
      {petals.map((p) => (
        <div
          key={p.id}
          className="petal-particle"
          style={{
            left: p.left,
            '--petal-size': `${p.size}px`,
            '--fall-duration': `${p.duration}s`,
            '--fall-delay': `${p.delay}s`,
            '--sway': p.sway,
            '--sway-end': p.swayEnd,
          } as React.CSSProperties}
        >
          <PetalSvg hue={p.hue} />
        </div>
      ))}

      {/* Central Lotus Bloom */}
      <div className={`lotus-bloom-container ${phase === 'expanding' ? 'expand' : ''}`}>
        {/* Background rays */}
        <div className="lotus-rays" />

        {/* Golden radiance */}
        <div className="lotus-radiance" />

        {/* Water reflection */}
        <div className="lotus-water" />

        {/* Stem */}
        <div className="lotus-stem" />

        {/* Pollen particles */}
        {pollen.map((dot) => (
          <div
            key={dot.id}
            className="pollen-particle"
            style={{
              top: dot.top,
              left: dot.left,
              '--pollen-dur': `${dot.dur}s`,
              '--pollen-delay': `${dot.delay}s`,
              '--pollen-dx': dot.dx,
              '--pollen-dy': dot.dy,
              '--pollen-dx2': dot.dx2,
              '--pollen-dy2': dot.dy2,
            } as React.CSSProperties}
          />
        ))}

        {/* Multi-layered SVG Lotus */}
        <svg
          className="lotus-svg"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Outer petal gradient — deep maroon-pink */}
            <linearGradient id="outerPetal" x1="0%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#b8436b" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#8b2252" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#5c1a3a" stopOpacity="0.85" />
            </linearGradient>
            {/* Mid petal gradient — rose */}
            <linearGradient id="midPetal" x1="0%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#db7093" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#c4577a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#a14060" stopOpacity="0.85" />
            </linearGradient>
            {/* Inner petal gradient — soft pink */}
            <linearGradient id="innerPetal" x1="0%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#f0a0bb" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#e88aa5" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#d47590" stopOpacity="0.85" />
            </linearGradient>
            {/* Core gradient — golden */}
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f5c84d" stopOpacity="1" />
              <stop offset="60%" stopColor="#e8a832" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#d4902a" stopOpacity="0.6" />
            </radialGradient>
            {/* Petal vein filter */}
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Layer 1: Outermost petals (8 petals, wide) */}
          <g className="lotus-petal-group layer-1" filter="url(#softGlow)">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <g key={`l1-${angle}`} transform={`rotate(${angle}, 100, 170)`}>
                <path
                  d="M100 170 C85 130, 70 90, 80 55 C88 35, 100 25, 100 25 C100 25, 112 35, 120 55 C130 90, 115 130, 100 170Z"
                  fill="url(#outerPetal)"
                  stroke="#7a2848"
                  strokeWidth="0.5"
                  opacity="0.85"
                />
                {/* Vein */}
                <path
                  d="M100 160 Q98 110, 100 40"
                  fill="none"
                  stroke="#5c1a3a"
                  strokeWidth="0.3"
                  opacity="0.3"
                />
              </g>
            ))}
          </g>

          {/* Layer 2: Middle petals (6 petals, offset) */}
          <g className="lotus-petal-group layer-2" filter="url(#softGlow)">
            {[22, 82, 142, 202, 262, 322].map((angle) => (
              <g key={`l2-${angle}`} transform={`rotate(${angle}, 100, 170)`}>
                <path
                  d="M100 170 C88 140, 78 105, 85 75 C90 58, 100 48, 100 48 C100 48, 110 58, 115 75 C122 105, 112 140, 100 170Z"
                  fill="url(#midPetal)"
                  stroke="#a14060"
                  strokeWidth="0.4"
                  opacity="0.9"
                />
                <path
                  d="M100 162 Q99 120, 100 55"
                  fill="none"
                  stroke="#8b3055"
                  strokeWidth="0.25"
                  opacity="0.3"
                />
              </g>
            ))}
          </g>

          {/* Layer 3: Inner petals (5 petals, tighter) */}
          <g className="lotus-petal-group layer-3" filter="url(#softGlow)">
            {[0, 72, 144, 216, 288].map((angle) => (
              <g key={`l3-${angle}`} transform={`rotate(${angle}, 100, 170)`}>
                <path
                  d="M100 170 C92 148, 85 120, 90 95 C93 82, 100 72, 100 72 C100 72, 107 82, 110 95 C115 120, 108 148, 100 170Z"
                  fill="url(#innerPetal)"
                  stroke="#c4577a"
                  strokeWidth="0.3"
                  opacity="0.95"
                />
              </g>
            ))}
          </g>

          {/* Layer 4: Central golden core */}
          <g className="lotus-petal-group layer-4">
            <circle cx="100" cy="155" r="14" fill="url(#coreGlow)" />
            {/* Small stamens */}
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <circle
                key={`s-${angle}`}
                cx={100 + 8 * Math.cos((angle * Math.PI) / 180)}
                cy={155 + 8 * Math.sin((angle * Math.PI) / 180)}
                r="2"
                fill="#f5d04e"
                opacity="0.8"
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Hook for gating the intro to first-visit-only                      */
/* ------------------------------------------------------------------ */
export function useLotusIntro() {
  const [shouldShow, setShouldShow] = React.useState(() => {
    // Only show if this is the first time the site is opened in this session
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem(SESSION_KEY);
  });

  const handleComplete = React.useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setShouldShow(false);
  }, []);

  return { shouldShow, handleComplete };
}

export default LotusIntro;
