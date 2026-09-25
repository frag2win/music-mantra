import React from 'react';
import './LotusIntro.css';

/**
 * LotusIntro v2 — Full-screen cinematic lotus bloom.
 *
 * The lotus fills the entire viewport, each petal unfurls individually
 * with smooth organic rotation from its base. Multiple petal layers
 * open outward in staggered waves, revealing a golden core.
 * Finally the bloom expands beyond the screen and fades into the app.
 */

const SESSION_KEY = 'swara__lotus_intro_played';
const TOTAL_DURATION_MS = 10200;
const EXPAND_START_MS = 7800;

/* ================================================================== */
/*  Falling Petal SVG — detailed organic shape with vein + highlight   */
/* ================================================================== */
const FallingPetalSvg: React.FC<{ hue: number; id: number }> = ({ hue, id }) => (
  <svg viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`fpg-${id}`} x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor={`hsl(${hue}, 50%, 55%)`} stopOpacity="0.95" />
        <stop offset="40%" stopColor={`hsl(${hue + 8}, 45%, 42%)`} stopOpacity="0.9" />
        <stop offset="100%" stopColor={`hsl(${hue + 15}, 40%, 30%)`} stopOpacity="0.8" />
      </linearGradient>
    </defs>
    <path
      d="M12 0 C8 5, 3 12, 1.5 20 C0.5 26, 4 34, 12 36 C20 34, 23.5 26, 22.5 20 C21 12, 16 5, 12 0Z"
      fill={`url(#fpg-${id})`}
      stroke={`hsl(${hue}, 35%, 25%)`}
      strokeWidth="0.3"
    />
    {/* Central vein */}
    <path d="M12 2 Q11 12, 11.5 22 Q12 30, 12 35" fill="none" stroke={`hsl(${hue}, 30%, 35%)`} strokeWidth="0.4" opacity="0.4" />
    {/* Side veins */}
    <path d="M12 10 Q8 14, 5 18" fill="none" stroke={`hsl(${hue}, 25%, 38%)`} strokeWidth="0.2" opacity="0.25" />
    <path d="M12 10 Q16 14, 19 18" fill="none" stroke={`hsl(${hue}, 25%, 38%)`} strokeWidth="0.2" opacity="0.25" />
    {/* Light highlight */}
    <ellipse cx="9" cy="14" rx="3" ry="6" fill="white" opacity="0.06" />
  </svg>
);

/* ================================================================== */
/*  Random generators                                                  */
/* ================================================================== */
interface FallingPetal {
  id: number;
  left: string;
  size: number;
  duration: number;
  delay: number;
  swayA: string; swayB: string; swayC: string; swayD: string; swayE: string;
  startRot: string;
  hue: number;
}

function generateFallingPetals(count: number): FallingPetal[] {
  const result: FallingPetal[] = [];
  for (let i = 0; i < count; i++) {
    const hue = 328 + Math.random() * 45;
    result.push({
      id: i,
      left: `${3 + Math.random() * 94}%`,
      size: 10 + Math.random() * 16,
      duration: 5.5 + Math.random() * 5,
      delay: Math.random() * 4,
      swayA: `${(Math.random() - 0.5) * 30}px`,
      swayB: `${(Math.random() - 0.5) * 50}px`,
      swayC: `${(Math.random() - 0.5) * 40}px`,
      swayD: `${(Math.random() - 0.5) * 35}px`,
      swayE: `${(Math.random() - 0.5) * 25}px`,
      startRot: `${Math.random() * 360}deg`,
      hue: Math.round(hue) % 360,
    });
  }
  return result;
}

interface PollenDot {
  id: number;
  cx: string; cy: string;
  size: number;
  dur: number; delay: number;
  dx1: string; dy1: string;
  dx2: string; dy2: string;
  dx3: string; dy3: string;
  dx4: string; dy4: string;
}

function generatePollen(count: number): PollenDot[] {
  const dots: PollenDot[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 20 + Math.random() * 25;
    dots.push({
      id: i,
      cx: `${50 + radius * Math.cos(angle)}%`,
      cy: `${50 + radius * Math.sin(angle) * 0.6}%`,
      size: 2 + Math.random() * 3,
      dur: 4 + Math.random() * 4,
      delay: 5.5 + Math.random() * 2.5,
      dx1: `${(Math.random() - 0.5) * 20}px`,
      dy1: `${-5 - Math.random() * 15}px`,
      dx2: `${(Math.random() - 0.5) * 35}px`,
      dy2: `${-15 - Math.random() * 25}px`,
      dx3: `${(Math.random() - 0.5) * 25}px`,
      dy3: `${-30 - Math.random() * 30}px`,
      dx4: `${(Math.random() - 0.5) * 15}px`,
      dy4: `${-45 - Math.random() * 30}px`,
    });
  }
  return dots;
}

/* ================================================================== */
/*  Petal path generator — creates detailed organic petal shapes       */
/* ================================================================== */

/** Generate a realistic petal <path> d-attribute pointing upward from origin */
function petalPath(length: number, width: number, curveFactor = 0.6): string {
  const hw = width / 2;
  const cp1y = length * 0.3;
  const cp2y = length * 0.7;
  const tipY = -length;
  const bulge = hw * curveFactor;

  return [
    `M 0 0`,
    `C ${hw + bulge} ${-cp1y}, ${hw} ${-cp2y}, 0 ${tipY}`,
    `C ${-hw} ${-cp2y}, ${-hw - bulge} ${-cp1y}, 0 0`,
    `Z`,
  ].join(' ');
}

/* ================================================================== */
/*  Lotus petal layer definitions                                      */
/* ================================================================== */

interface PetalDef {
  angle: number;        // rotation around the center
  length: number;
  width: number;
  curve: number;
  delay: number;        // animation delay in seconds
  duration: number;     // animation duration in seconds
  closedRot: number;    // initial closed rotation (degrees from current direction)
  fill: string;
  strokeColor: string;
  opacity: number;
}

function makeLayerPetals(
  count: number,
  offsetAngle: number,
  length: number,
  width: number,
  curve: number,
  baseDelay: number,
  duration: number,
  closedRot: number,
  fill: string,
  stroke: string,
  opacity: number,
): PetalDef[] {
  const step = 360 / count;
  return Array.from({ length: count }, (_, i) => ({
    angle: offsetAngle + i * step,
    length,
    width,
    curve,
    delay: baseDelay + i * 0.12,
    duration,
    closedRot,
    fill,
    strokeColor: stroke,
    opacity,
  }));
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */
export const LotusIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = React.useState<'playing' | 'expanding' | 'fading' | 'done'>('playing');

  const fallingPetals = React.useMemo(() => generateFallingPetals(40), []);
  const pollen = React.useMemo(() => generatePollen(16), []);

  // Build all petal layers
  const allPetals = React.useMemo<PetalDef[]>(() => {
    // Layer 1: outermost — large, deep maroon, 10 petals
    const layer1 = makeLayerPetals(10, 0, 88, 34, 0.7, 2.6, 3.0, 25, 'url(#outerGrad)', '#5c1a3a', 0.85);
    // Layer 2: mid-outer — rose, 8 petals offset
    const layer2 = makeLayerPetals(8, 18, 74, 30, 0.6, 3.2, 2.8, 20, 'url(#midGrad)', '#8b3055', 0.9);
    // Layer 3: mid-inner — pink, 7 petals
    const layer3 = makeLayerPetals(7, 8, 58, 26, 0.55, 3.8, 2.5, 15, 'url(#innerGrad)', '#a14060', 0.92);
    // Layer 4: inner cup — soft pink, 6 petals
    const layer4 = makeLayerPetals(6, 30, 42, 22, 0.5, 4.4, 2.2, 12, 'url(#cupGrad)', '#c4577a', 0.95);
    // Layer 5: innermost — lightest, 5 petals
    const layer5 = makeLayerPetals(5, 15, 30, 18, 0.45, 5.0, 2.0, 8, 'url(#heartGrad)', '#d47590', 0.97);

    return [...layer1, ...layer2, ...layer3, ...layer4, ...layer5];
  }, []);

  React.useEffect(() => {
    const expandTimer = setTimeout(() => setPhase('expanding'), EXPAND_START_MS);
    const fadeTimer = setTimeout(() => setPhase('fading'), TOTAL_DURATION_MS - 1200);
    const doneTimer = setTimeout(() => { setPhase('done'); onComplete(); }, TOTAL_DURATION_MS);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  // The lotus viewBox — origin at center
  const VB = 200;
  const half = VB / 2;

  return (
    <div className={`lotus-intro-overlay ${phase === 'fading' ? 'fade-out' : ''}`}>
      {/* Atmospheric mist */}
      <div className="lotus-mist" />

      {/* Falling petals */}
      {fallingPetals.map((p) => (
        <div
          key={p.id}
          className="petal-particle"
          style={{
            left: p.left,
            '--petal-size': `${p.size}px`,
            '--fall-duration': `${p.duration}s`,
            '--fall-delay': `${p.delay}s`,
            '--sway-a': p.swayA,
            '--sway-b': p.swayB,
            '--sway-c': p.swayC,
            '--sway-d': p.swayD,
            '--sway-e': p.swayE,
            '--start-rot': p.startRot,
          } as React.CSSProperties}
        >
          <FallingPetalSvg hue={p.hue} id={p.id} />
        </div>
      ))}

      {/* Light rays behind the lotus */}
      <div className="lotus-light-rays" />

      {/* Radiance glow */}
      <div className="lotus-back-radiance" />

      {/* Floating pollen */}
      {pollen.map((d) => (
        <div
          key={d.id}
          className="pollen-dot"
          style={{
            left: d.cx,
            top: d.cy,
            '--dot-size': `${d.size}px`,
            '--dot-dur': `${d.dur}s`,
            '--dot-delay': `${d.delay}s`,
            '--dx1': d.dx1, '--dy1': d.dy1,
            '--dx2': d.dx2, '--dy2': d.dy2,
            '--dx3': d.dx3, '--dy3': d.dy3,
            '--dx4': d.dx4, '--dy4': d.dy4,
          } as React.CSSProperties}
        />
      ))}

      {/* ---- Central Lotus SVG ---- */}
      <div className="lotus-svg-wrapper">
        <svg
          className={`lotus-main-svg ${phase === 'expanding' ? 'bloom-expand' : ''}`}
          viewBox={`${-half} ${-half} ${VB} ${VB}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Petal gradients — each layer gets richer color */}
            <linearGradient id="outerGrad" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#6b1d40" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#8b2252" stopOpacity="0.92" />
              <stop offset="70%" stopColor="#a53060" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#b8436b" stopOpacity="0.80" />
            </linearGradient>

            <linearGradient id="midGrad" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#8b2252" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#b8436b" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#d4627e" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="innerGrad" x1="0%" y1="100%" x2="40%" y2="0%">
              <stop offset="0%" stopColor="#b8436b" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#db7093" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#e88aa5" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="cupGrad" x1="0%" y1="100%" x2="40%" y2="0%">
              <stop offset="0%" stopColor="#d4627e" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#e88aa5" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#f0b0c5" stopOpacity="0.88" />
            </linearGradient>

            <linearGradient id="heartGrad" x1="0%" y1="100%" x2="40%" y2="0%">
              <stop offset="0%" stopColor="#e88aa5" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#f0b0c5" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#f8d0dd" stopOpacity="0.88" />
            </linearGradient>

            {/* Core radial */}
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="1" />
              <stop offset="40%" stopColor="#f5c84d" stopOpacity="0.9" />
              <stop offset="75%" stopColor="#e8a832" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#d4902a" stopOpacity="0.5" />
            </radialGradient>

            {/* Soft vein stroke */}
            <linearGradient id="veinGrad" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="rgba(60,20,30,0.3)" />
              <stop offset="100%" stopColor="rgba(60,20,30,0.05)" />
            </linearGradient>
          </defs>

          {/* Render all petals — outer layers first (painted behind inner) */}
          {allPetals.map((p, idx) => {
            const d = petalPath(p.length, p.width, p.curve);
            const veinD = `M 0 0 Q -1 ${-p.length * 0.4}, 0 ${-p.length * 0.95}`;
            // Side vein paths
            const sideVeinL = `M 0 ${-p.length * 0.25} Q ${-p.width * 0.3} ${-p.length * 0.45}, ${-p.width * 0.45} ${-p.length * 0.55}`;
            const sideVeinR = `M 0 ${-p.length * 0.25} Q ${p.width * 0.3} ${-p.length * 0.45}, ${p.width * 0.45} ${-p.length * 0.55}`;

            return (
              <g
                key={idx}
                transform={`rotate(${p.angle}, 0, 0) translate(0, 4)`}
              >
                <g
                  className="lotus-petal"
                  style={{
                    '--petal-delay': `${p.delay}s`,
                    '--petal-dur': `${p.duration}s`,
                    '--petal-closed-rot': `${p.closedRot}deg`,
                    '--petal-origin-x': '50%',
                    '--petal-origin-y': '100%',
                  } as React.CSSProperties}
                >
                  {/* Petal body */}
                  <path
                    d={d}
                    fill={p.fill}
                    stroke={p.strokeColor}
                    strokeWidth="0.3"
                    opacity={p.opacity}
                  />
                  {/* Central vein */}
                  <path d={veinD} fill="none" stroke="url(#veinGrad)" strokeWidth="0.4" />
                  {/* Side veins */}
                  <path d={sideVeinL} fill="none" stroke="url(#veinGrad)" strokeWidth="0.2" opacity="0.5" />
                  <path d={sideVeinR} fill="none" stroke="url(#veinGrad)" strokeWidth="0.2" opacity="0.5" />
                  {/* Highlight shimmer */}
                  <ellipse
                    cx={-p.width * 0.12}
                    cy={-p.length * 0.45}
                    rx={p.width * 0.15}
                    ry={p.length * 0.2}
                    fill="white"
                    opacity="0.05"
                  />
                </g>
              </g>
            );
          })}

          {/* Golden center core */}
          <g className="lotus-core-group" style={{ '--core-delay': '5.6s' } as React.CSSProperties}>
            <circle cx="0" cy="0" r="10" fill="url(#coreGlow)" />
            {/* Stamens */}
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i * 45 * Math.PI) / 180;
              return (
                <circle
                  key={i}
                  cx={6.5 * Math.cos(a)}
                  cy={6.5 * Math.sin(a)}
                  r="1.5"
                  fill="#fde68a"
                  opacity="0.85"
                />
              );
            })}
            {/* Inner tiny ring */}
            <circle cx="0" cy="0" r="4" fill="none" stroke="#f5c84d" strokeWidth="0.5" opacity="0.4" />
          </g>
        </svg>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  First-visit gate                                                   */
/* ================================================================== */
export function useLotusIntro() {
  const [shouldShow, setShouldShow] = React.useState(() => {
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
