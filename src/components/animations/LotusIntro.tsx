import React from 'react';
import './LotusIntro.css';

/**
 * LotusIntro v4 — Lightweight, butter-smooth.
 *
 * Only renders: falling petals (18) + lotus SVG (3 layers, 21 petals).
 * No light rays, radiance, mist, pollen, or bright wash.
 * Ending: the overlay simply fades out via CSS transition.
 *
 * Total animated DOM nodes: ~40 (was ~90+ in v3).
 */

const SESSION_KEY = 'swara__lotus_intro_played';
const EXIT_START = 7500;   // start fading out
const DONE_AT    = 9400;   // unmount

/* ================================================================== */
/*  Falling petal SVG — single lightweight path                        */
/* ================================================================== */
const PetalSVG: React.FC<{ hue: number; id: number }> = React.memo(({ hue, id }) => (
  <svg viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`fp${id}`} x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor={`hsl(${hue}, 48%, 52%)`} stopOpacity="0.9" />
        <stop offset="100%" stopColor={`hsl(${hue + 15}, 38%, 28%)`} stopOpacity="0.75" />
      </linearGradient>
    </defs>
    <path
      d="M12 0 C8 5,2.5 13,1.5 20 C0.5 27,4 34,12 36 C20 34,23.5 27,22.5 20 C21.5 13,16 5,12 0Z"
      fill={`url(#fp${id})`}
    />
    <path d="M12 3 Q11.5 15,12 35" fill="none" stroke={`hsl(${hue},25%,30%)`} strokeWidth="0.3" opacity="0.3" />
  </svg>
));

/* ================================================================== */
/*  Generators                                                         */
/* ================================================================== */

interface FPetal {
  id: number; left: string; size: number; dur: number; delay: number;
  sw1: string; sw2: string; sw3: string; sw4: string; sw5: string; sw6: string;
  r0: string; r1: string; r2: string; r3: string; r4: string; r5: string; r6: string;
  hue: number;
}

function genFalling(n: number): FPetal[] {
  const out: FPetal[] = [];
  for (let i = 0; i < n; i++) {
    const hue = 325 + Math.random() * 50;
    const b = Math.random() * 360;
    out.push({
      id: i,
      left: `${3 + Math.random() * 94}%`,
      size: 9 + Math.random() * 14,
      dur: 6 + Math.random() * 5,
      delay: Math.random() * 3.5,
      sw1: `${(Math.random() - 0.5) * 25}px`,
      sw2: `${(Math.random() - 0.5) * 40}px`,
      sw3: `${(Math.random() - 0.5) * 45}px`,
      sw4: `${(Math.random() - 0.5) * 30}px`,
      sw5: `${(Math.random() - 0.5) * 35}px`,
      sw6: `${(Math.random() - 0.5) * 20}px`,
      r0: `${b}deg`,
      r1: `${b + 25 + Math.random() * 15}deg`,
      r2: `${b + 65 + Math.random() * 25}deg`,
      r3: `${b + 140 + Math.random() * 30}deg`,
      r4: `${b + 220 + Math.random() * 30}deg`,
      r5: `${b + 295 + Math.random() * 25}deg`,
      r6: `${b + 360 + Math.random() * 20}deg`,
      hue: Math.round(hue) % 360,
    });
  }
  return out;
}

/* ================================================================== */
/*  Petal path                                                         */
/* ================================================================== */

function petalD(len: number, w: number, curve = 0.6): string {
  const hw = w / 2;
  const c1 = len * 0.3, c2 = len * 0.7;
  return `M0 0 C${hw + hw * curve} ${-c1},${hw} ${-c2},0 ${-len} C${-hw} ${-c2},${-hw - hw * curve} ${-c1},0 0Z`;
}

interface PCfg {
  angle: number; len: number; w: number; curve: number;
  delay: number; dur: number; rot: number; fill: string; op: number;
}

function makeLayer(
  count: number, offset: number, len: number, w: number, curve: number,
  baseDelay: number, dur: number, rot: number, fill: string, op: number,
): PCfg[] {
  const step = 360 / count;
  return Array.from({ length: count }, (_, i) => ({
    angle: offset + i * step, len, w, curve,
    delay: baseDelay + i * 0.12, dur, rot, fill, op,
  }));
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export const LotusIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [exiting, setExiting] = React.useState(false);

  const falling = React.useMemo(() => genFalling(18), []);

  // 3 layers only = 21 total SVG petals (lightweight)
  const petals = React.useMemo<PCfg[]>(() => [
    ...makeLayer(8,  0,  82, 30, 0.65, 2.2, 3.0, 22, 'url(#gO)', 0.85),
    ...makeLayer(7,  18, 62, 24, 0.55, 2.9, 2.7, 16, 'url(#gM)', 0.9),
    ...makeLayer(6,  10, 42, 18, 0.48, 3.6, 2.4, 10, 'url(#gI)', 0.95),
  ], []);

  React.useEffect(() => {
    // Start exit fade
    const t1 = setTimeout(() => {
      requestAnimationFrame(() => setExiting(true));
    }, EXIT_START);

    // Unmount after CSS transition completes
    const t2 = setTimeout(() => {
      requestAnimationFrame(() => onComplete());
    }, DONE_AT);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  const half = 100;

  return (
    <div className={`lotus-intro-overlay${exiting ? ' phase-exit' : ''}`}>

      {/* Falling petals */}
      {falling.map((p) => (
        <div
          key={p.id}
          className="petal-particle"
          style={{
            left: p.left,
            '--p-sz': `${p.size}px`, '--p-dur': `${p.dur}s`, '--p-del': `${p.delay}s`,
            '--sw1': p.sw1, '--sw2': p.sw2, '--sw3': p.sw3,
            '--sw4': p.sw4, '--sw5': p.sw5, '--sw6': p.sw6,
            '--p-r0': p.r0, '--p-r1': p.r1, '--p-r2': p.r2, '--p-r3': p.r3,
            '--p-r4': p.r4, '--p-r5': p.r5, '--p-r6': p.r6,
          } as React.CSSProperties}
        >
          <PetalSVG hue={p.hue} id={p.id} />
        </div>
      ))}

      {/* Lotus */}
      <div className="lotus-svg-wrapper">
        <svg
          className="lotus-main-svg"
          viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gO" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#6b1d40" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#8b2252" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#b8436b" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="gM" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#8b2252" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#c4577a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#e88aa5" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="gI" x1="0%" y1="100%" x2="40%" y2="0%">
              <stop offset="0%" stopColor="#c4577a" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#e88aa5" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f0b0c5" stopOpacity="0.85" />
            </linearGradient>
            <radialGradient id="cG" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="50%" stopColor="#f5c84d" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#d4902a" stopOpacity="0.5" />
            </radialGradient>
            <linearGradient id="vG" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="rgba(60,20,30,0.2)" />
              <stop offset="100%" stopColor="rgba(60,20,30,0.03)" />
            </linearGradient>
          </defs>

          {petals.map((p, i) => {
            const d = petalD(p.len, p.w, p.curve);
            const vein = `M0 0 Q-0.6 ${-p.len * 0.4},0 ${-p.len * 0.92}`;
            return (
              <g key={i} transform={`rotate(${p.angle},0,0) translate(0,4)`}>
                <g
                  className="lotus-petal"
                  style={{
                    '--pt-del': `${p.delay}s`,
                    '--pt-dur': `${p.dur}s`,
                    '--pt-rot': `${p.rot}deg`,
                  } as React.CSSProperties}
                >
                  <path d={d} fill={p.fill} opacity={p.op} />
                  <path d={vein} fill="none" stroke="url(#vG)" strokeWidth="0.3" />
                </g>
              </g>
            );
          })}

          {/* Golden core */}
          <g className="lotus-core-group" style={{ '--c-del': '4.8s' } as React.CSSProperties}>
            <circle cx="0" cy="0" r="9" fill="url(#cG)" />
            {Array.from({ length: 6 }, (_, i) => {
              const a = (i * 60 * Math.PI) / 180;
              return <circle key={i} cx={5.5 * Math.cos(a)} cy={5.5 * Math.sin(a)} r="1.3" fill="#fde68a" opacity="0.8" />;
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Hook                                                               */
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
    setDashboardEntrance(true);
    setTimeout(() => setDashboardEntrance(false), 1000);
  }, []);

  return { shouldShow, handleComplete, dashboardEntrance };
}

export default LotusIntro;
