import React from 'react';
import './LotusIntro.css';

/**
 * LotusIntro v3 — Butter-smooth GPU-composited lotus bloom.
 *
 * Performance:
 * • All animations use ONLY transform + opacity (GPU composited)
 * • translateZ(0) forces dedicated compositor layers
 * • will-change + backface-visibility: hidden on every animated node
 * • Reduced DOM node count (28 petals falling, 10 pollen)
 * • requestAnimationFrame for phase transitions
 *
 * Phases:
 *   playing → brightening → revealing → done
 *
 * The "brightening" phase adds a radiant golden/white wash from center
 * while the lotus gently expands. Then "revealing" fades the entire
 * overlay out smoothly, and the dashboard slides up with an entrance
 * animation.
 */

const SESSION_KEY = 'swara__lotus_intro_played';

// Timing (ms)
const BRIGHT_START = 8000;   // bright wash begins
const REVEAL_START = 9800;   // overlay starts fading out
const DONE_AT      = 11400;  // unmount + mark session

/* ================================================================== */
/*  Falling Petal SVG — lightweight, GPU-friendly                      */
/* ================================================================== */
const PetalSVG: React.FC<{ hue: number; id: number }> = React.memo(({ hue, id }) => (
  <svg viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`fp${id}`} x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor={`hsl(${hue}, 50%, 55%)`} stopOpacity="0.92" />
        <stop offset="50%" stopColor={`hsl(${hue + 10}, 45%, 40%)`} stopOpacity="0.88" />
        <stop offset="100%" stopColor={`hsl(${hue + 18}, 38%, 28%)`} stopOpacity="0.78" />
      </linearGradient>
    </defs>
    <path
      d="M12 0 C8 5, 2.5 13, 1.5 20 C0.5 27, 4 34, 12 36 C20 34, 23.5 27, 22.5 20 C21.5 13, 16 5, 12 0Z"
      fill={`url(#fp${id})`}
    />
    <path d="M12 3 Q11.2 14, 11.8 24 Q12 32, 12 35" fill="none" stroke={`hsl(${hue}, 28%, 32%)`} strokeWidth="0.35" opacity="0.35" />
    <path d="M12 12 Q8 16, 5 19" fill="none" stroke={`hsl(${hue}, 22%, 35%)`} strokeWidth="0.18" opacity="0.2" />
    <path d="M12 12 Q16 16, 19 19" fill="none" stroke={`hsl(${hue}, 22%, 35%)`} strokeWidth="0.18" opacity="0.2" />
    <ellipse cx="9" cy="15" rx="2.5" ry="5.5" fill="white" opacity="0.045" />
  </svg>
));

/* ================================================================== */
/*  Random generators                                                  */
/* ================================================================== */

interface FPetal {
  id: number; left: string; size: number; dur: number; delay: number;
  sw1: string; sw2: string; sw3: string; sw4: string; sw5: string; sw6: string; sw7: string;
  r0: string; r1: string; r2: string; r3: string; r4: string; r5: string; r6: string; r7: string;
  hue: number;
}

function genFallingPetals(n: number): FPetal[] {
  const out: FPetal[] = [];
  for (let i = 0; i < n; i++) {
    const hue = 325 + Math.random() * 50;
    const base = Math.random() * 360;
    out.push({
      id: i,
      left: `${2 + Math.random() * 96}%`,
      size: 9 + Math.random() * 15,
      dur: 6 + Math.random() * 5.5,
      delay: Math.random() * 4.5,
      sw1: `${(Math.random() - 0.5) * 25}px`,
      sw2: `${(Math.random() - 0.5) * 45}px`,
      sw3: `${(Math.random() - 0.5) * 50}px`,
      sw4: `${(Math.random() - 0.5) * 35}px`,
      sw5: `${(Math.random() - 0.5) * 40}px`,
      sw6: `${(Math.random() - 0.5) * 30}px`,
      sw7: `${(Math.random() - 0.5) * 20}px`,
      r0: `${base}deg`,
      r1: `${base + 20 + Math.random() * 15}deg`,
      r2: `${base + 55 + Math.random() * 25}deg`,
      r3: `${base + 120 + Math.random() * 30}deg`,
      r4: `${base + 200 + Math.random() * 30}deg`,
      r5: `${base + 270 + Math.random() * 30}deg`,
      r6: `${base + 330 + Math.random() * 20}deg`,
      r7: `${base + 370 + Math.random() * 25}deg`,
      hue: Math.round(hue) % 360,
    });
  }
  return out;
}

interface PDot {
  id: number; cx: string; cy: string; size: number; dur: number; delay: number;
  dx1: string; dy1: string; dx2: string; dy2: string; dx3: string; dy3: string; dx4: string; dy4: string;
}

function genPollen(n: number): PDot[] {
  const out: PDot[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 18 + Math.random() * 28;
    out.push({
      id: i,
      cx: `${50 + r * Math.cos(a)}%`,
      cy: `${50 + r * Math.sin(a) * 0.55}%`,
      size: 2 + Math.random() * 2.5,
      dur: 4.5 + Math.random() * 4,
      delay: 6 + Math.random() * 2.5,
      dx1: `${(Math.random() - 0.5) * 18}px`, dy1: `${-4 - Math.random() * 12}px`,
      dx2: `${(Math.random() - 0.5) * 30}px`, dy2: `${-14 - Math.random() * 22}px`,
      dx3: `${(Math.random() - 0.5) * 22}px`, dy3: `${-28 - Math.random() * 25}px`,
      dx4: `${(Math.random() - 0.5) * 12}px`, dy4: `${-42 - Math.random() * 25}px`,
    });
  }
  return out;
}

/* ================================================================== */
/*  Petal geometry                                                     */
/* ================================================================== */

function petalD(len: number, w: number, curve = 0.6): string {
  const hw = w / 2;
  const c1 = len * 0.3;
  const c2 = len * 0.7;
  return `M0 0 C${hw + hw * curve} ${-c1},${hw} ${-c2},0 ${-len} C${-hw} ${-c2},${-hw - hw * curve} ${-c1},0 0Z`;
}

interface PetalCfg {
  angle: number; len: number; w: number; curve: number;
  delay: number; dur: number; rot: number; fill: string; op: number;
}

function layer(
  count: number, offset: number, len: number, w: number, curve: number,
  baseDelay: number, dur: number, rot: number, fill: string, op: number,
): PetalCfg[] {
  const step = 360 / count;
  return Array.from({ length: count }, (_, i) => ({
    angle: offset + i * step,
    len, w, curve,
    delay: baseDelay + i * 0.1,
    dur, rot, fill, op,
  }));
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

type Phase = 'playing' | 'brightening' | 'revealing' | 'done';

export const LotusIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = React.useState<Phase>('playing');

  const falling = React.useMemo(() => genFallingPetals(28), []);
  const pollen = React.useMemo(() => genPollen(10), []);

  const petals = React.useMemo<PetalCfg[]>(() => [
    ...layer(10, 0,  85, 32, 0.7, 2.4, 3.2, 24, 'url(#gO)', 0.85),
    ...layer(8,  20, 70, 28, 0.6, 3.0, 3.0, 20, 'url(#gM)', 0.9),
    ...layer(7,  8,  55, 24, 0.55, 3.6, 2.7, 15, 'url(#gI)', 0.92),
    ...layer(6,  30, 40, 20, 0.5,  4.2, 2.4, 11, 'url(#gC)', 0.95),
    ...layer(5,  15, 28, 16, 0.45, 4.8, 2.1, 7,  'url(#gH)', 0.97),
  ], []);

  // Use rAF-aligned phase transitions for zero-jank switching
  React.useEffect(() => {
    let raf1: number, raf2: number, raf3: number;
    const t1 = setTimeout(() => { raf1 = requestAnimationFrame(() => setPhase('brightening')); }, BRIGHT_START);
    const t2 = setTimeout(() => { raf2 = requestAnimationFrame(() => setPhase('revealing')); }, REVEAL_START);
    const t3 = setTimeout(() => { raf3 = requestAnimationFrame(() => { setPhase('done'); onComplete(); }); }, DONE_AT);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); cancelAnimationFrame(raf3);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  const VB = 200;
  const half = VB / 2;

  const overlayClass = [
    'lotus-intro-overlay',
    phase === 'brightening' ? 'phase-brightening' : '',
    phase === 'revealing' ? 'phase-revealing' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={overlayClass}>
      {/* Atmospheric mist */}
      <div className="lotus-mist" />

      {/* Bright wash layer (visible during brightening phase) */}
      <div className="bright-wash" />

      {/* Falling petals */}
      {falling.map((p) => (
        <div
          key={p.id}
          className="petal-particle"
          style={{
            left: p.left,
            '--p-sz': `${p.size}px`, '--p-dur': `${p.dur}s`, '--p-del': `${p.delay}s`,
            '--sw1': p.sw1, '--sw2': p.sw2, '--sw3': p.sw3, '--sw4': p.sw4,
            '--sw5': p.sw5, '--sw6': p.sw6, '--sw7': p.sw7,
            '--p-r0': p.r0, '--p-r1': p.r1, '--p-r2': p.r2, '--p-r3': p.r3,
            '--p-r4': p.r4, '--p-r5': p.r5, '--p-r6': p.r6, '--p-r7': p.r7,
          } as React.CSSProperties}
        >
          <PetalSVG hue={p.hue} id={p.id} />
        </div>
      ))}

      {/* Light rays */}
      <div className="lotus-light-rays" />

      {/* Radiance */}
      <div className="lotus-back-radiance" />

      {/* Pollen */}
      {pollen.map((d) => (
        <div
          key={d.id}
          className="pollen-dot"
          style={{
            left: d.cx, top: d.cy,
            '--d-sz': `${d.size}px`, '--d-dur': `${d.dur}s`, '--d-del': `${d.delay}s`,
            '--dx1': d.dx1, '--dy1': d.dy1, '--dx2': d.dx2, '--dy2': d.dy2,
            '--dx3': d.dx3, '--dy3': d.dy3, '--dx4': d.dx4, '--dy4': d.dy4,
          } as React.CSSProperties}
        />
      ))}

      {/* Central Lotus SVG */}
      <div className="lotus-svg-wrapper">
        <svg
          className={`lotus-main-svg ${phase === 'brightening' ? 'phase-bright' : ''}`}
          viewBox={`${-half} ${-half} ${VB} ${VB}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gO" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#6b1d40" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#8b2252" stopOpacity="0.92" />
              <stop offset="70%" stopColor="#a53060" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#b8436b" stopOpacity="0.80" />
            </linearGradient>
            <linearGradient id="gM" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#8b2252" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#b8436b" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#d4627e" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="gI" x1="0%" y1="100%" x2="40%" y2="0%">
              <stop offset="0%" stopColor="#b8436b" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#db7093" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#e88aa5" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="gC" x1="0%" y1="100%" x2="40%" y2="0%">
              <stop offset="0%" stopColor="#d4627e" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#e88aa5" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#f0b0c5" stopOpacity="0.88" />
            </linearGradient>
            <linearGradient id="gH" x1="0%" y1="100%" x2="40%" y2="0%">
              <stop offset="0%" stopColor="#e88aa5" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#f0b0c5" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#f8d0dd" stopOpacity="0.88" />
            </linearGradient>
            <radialGradient id="cG" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="45%" stopColor="#f5c84d" stopOpacity="0.9" />
              <stop offset="80%" stopColor="#e8a832" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#d4902a" stopOpacity="0.5" />
            </radialGradient>
            <linearGradient id="vG" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="rgba(60,20,30,0.25)" />
              <stop offset="100%" stopColor="rgba(60,20,30,0.04)" />
            </linearGradient>
          </defs>

          {/* All petals */}
          {petals.map((p, i) => {
            const d = petalD(p.len, p.w, p.curve);
            const vein = `M0 0 Q-0.8 ${-p.len * 0.4},0 ${-p.len * 0.95}`;
            const vL = `M0 ${-p.len * 0.22} Q${-p.w * 0.28} ${-p.len * 0.42},${-p.w * 0.42} ${-p.len * 0.52}`;
            const vR = `M0 ${-p.len * 0.22} Q${p.w * 0.28} ${-p.len * 0.42},${p.w * 0.42} ${-p.len * 0.52}`;
            return (
              <g key={i} transform={`rotate(${p.angle},0,0) translate(0,5)`}>
                <g
                  className="lotus-petal"
                  style={{
                    '--pt-del': `${p.delay}s`,
                    '--pt-dur': `${p.dur}s`,
                    '--pt-rot': `${p.rot}deg`,
                  } as React.CSSProperties}
                >
                  <path d={d} fill={p.fill} opacity={p.op} />
                  <path d={vein} fill="none" stroke="url(#vG)" strokeWidth="0.35" />
                  <path d={vL} fill="none" stroke="url(#vG)" strokeWidth="0.18" opacity="0.45" />
                  <path d={vR} fill="none" stroke="url(#vG)" strokeWidth="0.18" opacity="0.45" />
                  <ellipse cx={-p.w * 0.1} cy={-p.len * 0.42} rx={p.w * 0.13} ry={p.len * 0.18} fill="white" opacity="0.04" />
                </g>
              </g>
            );
          })}

          {/* Golden core */}
          <g className="lotus-core-group" style={{ '--c-del': '5.8s' } as React.CSSProperties}>
            <circle cx="0" cy="0" r="10" fill="url(#cG)" />
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * 45 * Math.PI) / 180;
              return <circle key={i} cx={6.5 * Math.cos(a)} cy={6.5 * Math.sin(a)} r="1.4" fill="#fde68a" opacity="0.8" />;
            })}
            <circle cx="0" cy="0" r="4" fill="none" stroke="#f5c84d" strokeWidth="0.45" opacity="0.35" />
          </g>
        </svg>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Hook: gate intro to first visit + trigger dashboard entrance       */
/* ================================================================== */
export function useLotusIntro() {
  const [shouldShow, setShouldShow] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem(SESSION_KEY);
  });
  const [dashboardEntrance, setDashboardEntrance] = React.useState(false);

  const handleComplete = React.useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setShouldShow(false);
    // Trigger dashboard entrance animation
    setDashboardEntrance(true);
    // Remove the entrance class after animation completes
    setTimeout(() => setDashboardEntrance(false), 1200);
  }, []);

  return { shouldShow, handleComplete, dashboardEntrance };
}

export default LotusIntro;
