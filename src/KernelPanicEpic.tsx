import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';

// 44s @ 30fps, 1080x1920. Every frame number below is a hit in
// scripts/make_music_kp_epic.py (120 BPM: 1 beat = 15 frames, 1 bar = 60).
export const KP_EPIC_DURATION = 1320;
const FPS = 30;
const FONT = "'DM Sans', sans-serif";
const HEAVY = "'Anton', 'DM Sans', sans-serif";
const MONO = "'DejaVu Sans Mono', 'Liberation Mono', monospace";
const RED = '#ff2d3d';
const BLUE = '#1f8bff';
const GREEN = '#2ee66b';
const CYAN = '#00e5ff';

const T = {
  dies: 60,
  title: 120,
  layers: [240, 255, 270, 285],
  kernelTxt: 300,
  chips: [360, 375, 390],
  but: 420,
  red: 450,
  zoomIn: 520,
  drop: 540,
  restart: 570,
  protect: 600,
  causes: [660, 720, 780, 840],
  rows: [900, 915, 930, 945],
  file: 960,
  fix: [1020, 1050, 1080, 1110, 1140, 1170],
  final: 1200,
  end: 1320,
};

// camera shake strength per hit
const HITS: [number, number][] = [
  [T.dies, 14],
  [T.title, 22],
  ...T.layers.map((h): [number, number] => [h, 10]),
  ...T.chips.map((h): [number, number] => [h, 7]),
  [T.red, 18],
  [T.drop, 34],
  [T.restart, 16],
  [T.protect, 12],
  ...T.causes.map((h): [number, number] => [h, 18]),
  ...T.rows.map((h): [number, number] => [h, 8]),
  [T.file, 18],
  ...T.fix.map((h): [number, number] => [h, 12]),
  [T.final, 30],
];

// ---------- helpers ----------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const tw = (f: number, a: number, b: number, e = out) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});
const hitEnv = (f: number, at: number, decay = 6) => (f < at ? 0 : Math.exp(-(f - at) / decay));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const inRange = (f: number, a: number, b: number) => f >= a && f < b;

/**
 * Hard-hitting trailer text: flips in from huge scale with ghost trails and RGB split,
 * metallic fill with a light sweep, extruded depth, zooms through on exit.
 */
const Slam: React.FC<{
  f: number;
  at: number;
  until?: number;
  y: number;
  size: number;
  color?: string;
  font?: string;
  spacing?: string;
  glitch?: number;
  children: React.ReactNode;
}> = ({f, at, until, y, size, color = '#fff', font = HEAVY, spacing = '0.01em', glitch = 0, children}) => {
  const t = f - at;
  if (t < 0 || (until !== undefined && f > until + 10)) return null;
  const heavy = font === HEAVY;
  const s = spring({frame: t, fps: FPS, config: {damping: 17, stiffness: 320, mass: 0.8}});
  const exit = until !== undefined ? tw(f, until, until + 9, Easing.in(Easing.cubic)) : 0;
  const scale = mix(2.6, 1, s) * (1 + exit * 2.8);
  const tilt = (1 - Math.min(1, s)) * 60;
  const opacity = Math.min(1, t / 3) * (1 - exit);
  const g = 16 * Math.exp(-t / 5) + glitch * 10;
  const transform = `translateY(-50%) perspective(1400px) rotateX(${tilt}deg) scale(${scale})`;
  const base: React.CSSProperties = {
    position: 'absolute',
    left: 30,
    right: 30,
    top: y,
    transform,
    textAlign: 'center',
    fontFamily: font,
    fontWeight: heavy ? 400 : 700,
    fontSize: heavy ? size * 1.25 : size,
    lineHeight: heavy ? 0.95 : 1,
    letterSpacing: heavy ? spacing : '0',
    whiteSpace: 'pre-line',
    textTransform: heavy ? 'uppercase' : undefined,
  };
  const dark = `color-mix(in srgb, ${color} 35%, black)`;
  const sweepStart = at + 4 + Math.max(0, Math.floor((f - at - 4) / 75)) * 75;
  const sweep = tw(f, sweepStart, sweepStart + 26, Easing.inOut(Easing.quad));
  return (
    <>
      {t < 9 &&
        [1, 2].map((k) => (
          <div key={k} style={{...base, color, opacity: (0.22 / k) * (1 - t / 9), transform: `${transform} scale(${1 + 0.22 * k * (1 - s)})`, filter: 'blur(4px)'}}>
            {children}
          </div>
        ))}
      {/* depth + chromatic split layer */}
      <div
        style={{
          ...base,
          color: dark,
          opacity,
          filter: exit > 0 ? `blur(${exit * 14}px)` : undefined,
          textShadow: [
            g > 0.5 ? `${g}px 0 ${RED}cc, ${-g}px 0 ${CYAN}cc` : '',
            `0 4px 0 ${dark}, 0 8px 0 color-mix(in srgb, ${color} 22%, black), 0 12px 0 color-mix(in srgb, ${color} 12%, black), 0 16px 0 #000`,
            `0 30px 50px rgba(0,0,0,.9)`,
          ]
            .filter(Boolean)
            .join(', '),
        }}
      >
        {children}
      </div>
      {/* metallic face */}
      <div
        style={{
          ...base,
          opacity,
          color: 'transparent',
          backgroundImage: `linear-gradient(105deg, transparent ${sweep * 140 - 30}%, rgba(255,255,255,.95) ${sweep * 140 - 20}%, transparent ${sweep * 140 - 10}%), linear-gradient(180deg, color-mix(in srgb, ${color} 45%, white) 0%, ${color} 46%, color-mix(in srgb, ${color} 60%, black) 54%, ${color} 78%, color-mix(in srgb, ${color} 60%, white) 100%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          filter: `drop-shadow(0 0 ${18 + hitEnv(f, at, 8) * 50}px color-mix(in srgb, ${color} 70%, transparent))${exit > 0 ? ` blur(${exit * 14}px)` : ''}`,
        }}
      >
        {children}
      </div>
      {glitch > 0.2 &&
        [0, 1, 2].map((k) => {
          const top = random(`gt${k}-${Math.floor(f / 2)}`) * 90;
          const h = 4 + random(`gh${k}-${Math.floor(f / 2)}`) * 14;
          const dx = (random(`gx${k}-${Math.floor(f / 2)}`) - 0.5) * 120 * glitch;
          return (
            <div key={`s${k}`} style={{...base, opacity, clipPath: `inset(${top}% 0 ${Math.max(0, 100 - top - h)}% 0)`, transform: `${transform} translateX(${dx}px)`, color: k === 1 ? CYAN : color}}>
              {children}
            </div>
          );
        })}
    </>
  );
};

/** Anamorphic lens flare streak */
const Flare: React.FC<{f: number; at: number; y: number; color?: string}> = ({f, at, y, color = '#7fc8ff'}) => {
  const e = hitEnv(f, at, 10);
  if (e < 0.02) return null;
  return (
    <>
      <div style={{position: 'absolute', left: -200, right: -200, top: y - 3, height: 6, background: `linear-gradient(90deg, transparent, ${color}, #fff, ${color}, transparent)`, opacity: e, boxShadow: `0 0 30px 8px ${color}`, transform: `scaleX(${0.4 + (1 - e) * 0.8})`}} />
      <div style={{position: 'absolute', left: 540 - 180, top: y - 180, width: 360, height: 360, borderRadius: '50%', background: `radial-gradient(circle, #fff 0%, ${color}99 18%, transparent 60%)`, opacity: e * 0.9}} />
    </>
  );
};

/** Rotating god rays behind a title */
const Rays: React.FC<{f: number; from: number; to: number; color: string; y?: number}> = ({f, from, to, color, y = 47}) => {
  const o = tw(f, from, from + 12) * (1 - tw(f, to - 10, to));
  if (o <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        opacity: o * 0.55,
        background: `repeating-conic-gradient(from ${(f - from) * 0.6}deg at 50% ${y}%, color-mix(in srgb, ${color} 55%, transparent) 0deg 3deg, transparent 3deg 15deg)`,
        WebkitMaskImage: `radial-gradient(circle at 50% ${y}%, black 0%, transparent 60%)`,
        maskImage: `radial-gradient(circle at 50% ${y}%, black 0%, transparent 60%)`,
      }}
    />
  );
};

/** Embers rising through the whole film */
const Embers: React.FC<{f: number; color: string}> = ({f, color}) => (
  <>
    {Array.from({length: 46}, (_, i) => {
      const speed = 2 + random(`es${i}`) * 6;
      const y = 2050 - ((f * speed + random(`ep${i}`) * 2200) % 2300);
      const x = random(`ex${i}`) * 1080 + Math.sin(f / (20 + i) + i) * 40;
      const size = 2 + random(`ez${i}`) * 5;
      const flick = 0.5 + 0.5 * Math.sin(f / 3 + i * 1.7);
      const c = i % 3 === 0 ? '#ffb347' : color;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%', background: c, boxShadow: `0 0 ${size * 3}px ${c}`, opacity: 0.35 + 0.5 * flick}} />;
    })}
  </>
);

const Small: React.FC<{f: number; at: number; until?: number; y: number; children: React.ReactNode; color?: string; size?: number}> = ({
  f,
  at,
  until,
  y,
  children,
  color = 'rgba(255,255,255,.75)',
  size = 40,
}) => {
  const p = tw(f, at, at + 10);
  const o = until !== undefined ? tw(f, until, until + 8) : 0;
  if (f < at) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: size, letterSpacing: '0.32em', color, opacity: p * (1 - o), transform: `translateY(${(1 - p) * 20 - o * 20}px)`}}>
      {children}
    </div>
  );
};

/** Typewriter text */
const Typed: React.FC<{f: number; at: number; text: string; cps?: number}> = ({f, at, text, cps = 2}) => {
  const n = Math.max(0, Math.min(text.length, Math.floor((f - at) / cps)));
  return (
    <>
      {text.slice(0, n)}
      {n < text.length && f >= at && Math.floor(f / 4) % 2 === 0 ? '▌' : ''}
    </>
  );
};

const Burst: React.FC<{f: number; at: number; colors: string[]; n?: number; x?: number; y?: number}> = ({f, at, colors, n = 110, x = 540, y = 900}) => {
  const t = f - at;
  if (t < 0 || t > 80) return null;
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const a = random(`ba${at}-${i}`) * Math.PI * 2;
        const v = 14 + random(`bv${at}-${i}`) * 46;
        const life = 30 + random(`bl${at}-${i}`) * 50;
        const size = 3 + random(`bs${at}-${i}`) * 9;
        const d = v * 16 * (1 - Math.exp(-t / 12));
        const c = colors[i % colors.length];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.cos(a) * d - size / 2,
              top: y + Math.sin(a) * d + 0.05 * t * t - size / 2,
              width: size * (t < 6 ? 3 : 1),
              height: size,
              borderRadius: size,
              background: c,
              opacity: Math.max(0, 1 - t / life),
              boxShadow: `0 0 ${size * 2}px ${c}`,
              transform: `rotate(${(a * 180) / Math.PI}deg)`,
            }}
          />
        );
      })}
    </>
  );
};

const SpeedLines: React.FC<{f: number; at: number; color?: string; len?: number}> = ({f, at, color = '#fff', len = 30}) => {
  const t = f - at;
  if (t < 0 || t > len) return null;
  const p = t / len;
  return (
    <AbsoluteFill style={{opacity: 1 - p}}>
      {Array.from({length: 48}, (_, i) => {
        const a = (i / 48) * 360 + random(`sl${at}-${i}`) * 6;
        const l = 300 + random(`sll${at}-${i}`) * 700;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 540,
              top: 900,
              width: l,
              height: 3 + random(`slw${at}-${i}`) * 4,
              background: `linear-gradient(90deg, transparent, ${color})`,
              transformOrigin: '0 50%',
              transform: `rotate(${a}deg) translateX(${200 + p * 900}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Ring: React.FC<{f: number; at: number; color?: string; y?: number}> = ({f, at, color = '#fff', y = 900}) => {
  const p = tw(f, at, at + 34);
  if (p <= 0 || p >= 1) return null;
  const r = 40 + p * 1300;
  return <div style={{position: 'absolute', left: 540 - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `${mix(10, 1, p)}px solid ${color}`, boxShadow: `0 0 50px ${color}`, opacity: 1 - p}} />;
};

// ---------- scene pieces ----------
const Phone: React.FC<{f: number}> = ({f}) => {
  const dead = f >= T.dies;
  const glitch = inRange(f, T.dies - 10, T.dies + 4);
  const dx = glitch ? (random(`ph${f}`) - 0.5) * 40 : 0;
  return (
    <div style={{position: 'absolute', left: 540 - 220, top: 1020 - 440, width: 440, height: 880, borderRadius: 76, border: '12px solid #2b2f39', background: '#000', overflow: 'hidden', transform: `translateX(${dx}px)`, boxShadow: `0 0 ${glitch ? 120 : 40}px ${glitch ? RED : '#000'}`}}>
      {!dead && (
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #1f3b73, #5b2a6e)', padding: '110px 36px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 26, alignContent: 'start', filter: glitch ? `hue-rotate(${random(`hr${f}`) * 180}deg)` : undefined}}>
          {Array.from({length: 20}, (_, i) => (
            <div key={i} style={{aspectRatio: '1', borderRadius: 18, background: `hsl(${(i * 47) % 360} 55% 55%)`, transform: glitch ? `translateX(${(random(`ic${i}-${f}`) - 0.5) * 60}px)` : undefined}} />
          ))}
        </div>
      )}
      {dead && f > T.dies + 8 && (
        <div style={{position: 'absolute', left: '50%', top: '50%', width: 90, height: 90, margin: -45, borderRadius: '50%', border: '8px solid rgba(255,255,255,.15)', borderTopColor: '#fff', transform: `rotate(${f * 14}deg)`}} />
      )}
    </div>
  );
};

const LAYERS = ['APPS', 'iOS', 'KERNEL', 'HARDWARE'];

const Stack: React.FC<{f: number}> = ({f}) => {
  const panic = tw(f, T.red, T.red + 4);
  const tremble = panic > 0 ? (mix(4, 26, tw(f, T.red, T.drop - 4, Easing.in(Easing.quad))) * (random(`tr${f}`) - 0.5)) : 0;
  const beat = f >= T.kernelTxt && f < T.red ? hitEnv(f, T.kernelTxt + Math.floor((f - T.kernelTxt) / 15) * 15, 5) : 0;
  return (
    <>
      {LAYERS.map((l, i) => {
        const at = T.layers[i];
        const t = f - at;
        if (t < 0) return null;
        const s = spring({frame: t, fps: FPS, config: {damping: 18, stiffness: 260, mass: 0.9}});
        const isK = l === 'KERNEL';
        const col = isK ? (panic > 0.5 ? RED : BLUE) : '#3a3f4b';
        const y = 760 + i * 190;
        const fromX = i % 2 ? 1400 : -1400;
        return (
          <div
            key={l}
            style={{
              position: 'absolute',
              left: 150,
              top: y,
              width: 780,
              height: 160,
              borderRadius: 34,
              background: isK ? `${col}2a` : '#14161c',
              border: `4px solid ${col}`,
              boxShadow: isK ? `0 0 ${80 + beat * 80 + panic * 120}px ${col}aa, inset 0 0 40px ${col}55` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: isK ? 72 : 54,
              letterSpacing: '0.14em',
              color: isK ? '#fff' : 'rgba(255,255,255,.55)',
              transform: `translateX(${mix(fromX, 0, s) + (isK ? tremble : tremble * 0.4)}px) skewX(${(1 - s) * (i % 2 ? -25 : 25)}deg) scale(${isK ? 1 + beat * 0.04 + panic * 0.05 : 1})`,
              opacity: isK ? 1 : mix(1, 0.3, panic),
            }}
          >
            {isK && panic > 0.5 ? 'PANIC' : l}
          </div>
        );
      })}
    </>
  );
};

const PanicLog: React.FC<{f: number}> = ({f}) => {
  const p = tw(f, T.red, T.red + 20);
  if (p <= 0) return null;
  const lines = Array.from({length: 40}, (_, i) => {
    const hex = Math.floor(random(`hx${i}`) * 0xffffffff).toString(16).padStart(8, '0');
    const hex2 = Math.floor(random(`hy${i}`) * 0xffffffff).toString(16).padStart(8, '0');
    return i % 5 === 0 ? `panic(cpu ${i % 6} caller 0xfffffff0${hex}): kernel fault` : `  0x${hex}${hex2}  lr: 0xfffffff0${hex2}`;
  });
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.22 * p, fontFamily: MONO, fontSize: 26, lineHeight: '38px', color: RED, padding: 40, whiteSpace: 'pre', transform: `translateY(${-((f - T.red) * 9) % 380}px)`}}>
      {lines.concat(lines).join('\n')}
    </div>
  );
};

const CAUSES = [
  {n: '01', title: 'SOFTWARE\nBUGS', sub: 'in iOS or an app', color: RED},
  {n: '02', title: 'FAULTY\nHARDWARE', sub: 'battery · cables · sensors', color: '#ff8a1f'},
  {n: '03', title: 'NON-GENUINE\nPARTS', sub: 'after a repair', color: '#ffd21f'},
  {n: '04', title: 'JAILBREAK\nTWEAKS', sub: 'a modified system', color: '#c23bff'},
];

const ROWS = ['SETTINGS', 'PRIVACY &\nSECURITY', 'ANALYTICS &\nIMPROVEMENTS', 'ANALYTICS\nDATA'];

// ---------- composition ----------
export const KernelPanicEpic: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);

  // camera
  const shake = HITS.reduce((a, [h, s]) => a + hitEnv(f, h, 6) * s, 0) + (inRange(f, T.red, T.drop) ? tw(f, T.red, T.drop, Easing.in(Easing.quad)) * 10 : 0);
  const sx = Math.sin(f * 2.7) * shake + Math.sin(f * 5.3) * shake * 0.4;
  const sy = Math.cos(f * 3.1) * shake * 0.8;
  const punch = HITS.reduce((a, [h, s]) => a + hitEnv(f, h, 9) * s * 0.0022, 0);
  const zoomIn = inRange(f, T.zoomIn, T.drop) ? Math.pow(tw(f, T.zoomIn, T.drop - 2, Easing.in(Easing.cubic)), 1) * 5 : 0;
  const drift = 1 + ((f % 60) / 60) * 0.015;
  const rot = Math.sin(f / 40) * 0.6 + hitEnv(f, T.drop, 10) * 3;

  // section colour
  const sectionColor =
    f < T.title ? '#1a2440' : f < T.layers[0] ? RED : f < T.red ? BLUE : f < T.causes[0] ? RED : f < T.rows[0] ? CAUSES[Math.min(3, Math.floor((f - T.causes[0]) / 60))].color : f < T.fix[0] ? BLUE : f < T.final ? (f < T.fix[3] ? GREEN : RED) : BLUE;
  const flash = Math.max(hitEnv(f, T.drop, 6), hitEnv(f, T.final, 6) * 0.9, hitEnv(f, T.title, 4) * 0.6, ...T.causes.map((h) => hitEnv(f, h, 4) * 0.5), hitEnv(f, T.dies, 4) * 0.5, hitEnv(f, T.file, 4) * 0.5);
  const blackout = inRange(f, T.drop - 4, T.drop) ? 1 : 0;

  return (
    <AbsoluteFill style={{background: '#030305', overflow: 'hidden', filter: [T.title, T.drop, T.drop + 1, T.final, T.final + 1].includes(f) ? 'invert(1) contrast(1.3)' : undefined}}>
      <Audio src={staticFile('kp/music-epic.wav')} />

      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${(drift + punch) * (1 + zoomIn)}) rotate(${rot}deg)`, transformOrigin: '50% 47%'}}>
        {/* backdrop */}
        <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 55% at 50% 47%, ${sectionColor}40, transparent 70%)`}} />
        <AbsoluteFill
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.04) 2px, transparent 2px)',
            backgroundSize: '120px 120px',
            backgroundPosition: `0 ${(f * 3) % 120}px`,
            transform: 'perspective(900px) rotateX(55deg) translateY(520px) scale(2.2)',
            opacity: 0.8,
          }}
        />
        {/* drifting fog */}
        <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 25% at ${30 + Math.sin(f / 60) * 20}% 70%, ${sectionColor}30, transparent 70%), radial-gradient(ellipse 50% 20% at ${70 + Math.cos(f / 50) * 20}% 25%, ${sectionColor}22, transparent 70%)`}} />
        <Rays f={f} from={T.title} to={T.layers[0]} color={RED} y={46} />
        <Rays f={f} from={T.drop} to={T.causes[0]} color="#ffffff" />
        <Rays f={f} from={T.final} to={T.end} color={BLUE} y={48} />
        <Embers f={f} color={sectionColor} />

        {/* 1. hook */}
        {f < T.title + 10 && (
          <>
            <div style={{opacity: 1 - tw(f, T.title - 8, T.title)}}>
              <Phone f={f} />
            </div>
            <Slam f={f} at={10} until={T.title - 8} y={330} size={120}>
              YOUR iPHONE
            </Slam>
            <Slam f={f} at={T.dies} until={T.title - 8} y={1620} size={130} color={RED} glitch={hitEnv(f, T.dies, 10)}>
              RESTARTED.
            </Slam>
          </>
        )}

        {/* 2. title */}
        {inRange(f, T.title, T.layers[0] + 10) && (
          <>
            <Slam f={f} at={T.title} until={T.layers[0] - 9} y={760} size={230}>
              KERNEL
            </Slam>
            <Slam f={f} at={T.title + 6} until={T.layers[0] - 9} y={980} size={250} color={RED} glitch={Math.max(hitEnv(f, T.title + 6, 14), (f - T.title) % 30 < 4 ? 0.8 : 0)}>
              PANIC
            </Slam>
            <Small f={f} at={T.title + 60} until={T.layers[0] - 9} y={1210} size={46}>
              <Typed f={f} at={T.title + 60} text="WHAT ACTUALLY HAPPENED?" cps={1.2} />
            </Small>
            <Ring f={f} at={T.title} color={RED} />
            <SpeedLines f={f} at={T.title} color={RED} />
          </>
        )}

        {/* 3 + 4. kernel and panic */}
        {inRange(f, T.layers[0], T.drop) && (
          <>
            <PanicLog f={f} />
            <Stack f={f} />
            <Slam f={f} at={T.kernelTxt} until={T.but - 9} y={470} size={150} color={BLUE}>
              THE KERNEL
            </Slam>
            <Small f={f} at={T.kernelTxt + 12} until={T.but - 9} y={590} size={42}>
              THE CORE OF iOS
            </Small>
            {['MEMORY', 'CPU', 'HARDWARE'].map((c, i) => {
              const at = T.chips[i];
              if (f < at || f > T.but) return null;
              const s = spring({frame: f - at, fps: FPS, config: {damping: 14, stiffness: 300}});
              const o = 1 - tw(f, T.but - 9, T.but);
              return (
                <div key={c} style={{position: 'absolute', top: 1560, left: 90 + i * 310, width: 280, height: 110, borderRadius: 999, border: `4px solid ${BLUE}`, background: `${BLUE}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 40, letterSpacing: '0.1em', color: '#fff', opacity: Math.min(1, s) * o, transform: `scale(${mix(2, 1, s)})`, boxShadow: `0 0 40px ${BLUE}88`}}>
                  {c}
                </div>
              );
            })}
            <Slam f={f} at={T.but} until={T.zoomIn} y={470} size={130}>
              BUT SOMETIMES…
            </Slam>
            <div style={{position: 'absolute', left: 0, right: 0, top: 1580, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 52, color: RED, opacity: f >= T.red + 12 ? 1 : 0, textShadow: `0 0 30px ${RED}`}}>
              <Typed f={f} at={T.red + 12} text="UNRECOVERABLE ERROR" cps={2} />
            </div>
            <Ring f={f} at={T.red} color={RED} y={1135} />
          </>
        )}

        {/* 5. drop: STOP. RESTART. */}
        {inRange(f, T.drop, T.causes[0] + 10) && (
          <>
            <AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{width: 640, height: 640, borderRadius: '50%', border: '16px solid rgba(255,255,255,.06)', borderTopColor: f >= T.restart ? '#fff' : RED, transform: `rotate(${(f - T.drop) * 11}deg) scale(${mix(0.3, 1, tw(f, T.drop, T.drop + 20))})`, opacity: 1 - tw(f, T.causes[0] - 9, T.causes[0])}} />
            </AbsoluteFill>
            <Slam f={f} at={T.drop} until={T.causes[0] - 9} y={f >= T.restart ? mix(900, 640, tw(f, T.restart, T.restart + 10)) : 900} size={300} color={RED} glitch={hitEnv(f, T.drop, 12)}>
              STOP.
            </Slam>
            <Slam f={f} at={T.restart} until={T.causes[0] - 9} y={980} size={190}>
              RESTART.
            </Slam>
            <Slam f={f} at={T.protect} until={T.causes[0] - 9} y={1340} size={64} color={GREEN} spacing="0.12em">
              {'TO PROTECT\nYOUR DATA'}
            </Slam>
            <Burst f={f} at={T.drop} colors={[RED, '#fff', CYAN, '#ff8a1f']} n={130} />
            <Ring f={f} at={T.drop} color="#fff" />
            <Ring f={f} at={T.drop + 5} color={RED} />
            <SpeedLines f={f} at={T.drop} len={40} />
          </>
        )}

        {/* 6. causes */}
        {inRange(f, T.causes[0], T.rows[0] + 10) && (
          <>
            <Small f={f} at={T.causes[0]} until={T.rows[0] - 9} y={300} size={44} color="#fff">
              COMMON CAUSES
            </Small>
            {CAUSES.map((c, i) => {
              const at = T.causes[i];
              const until = i < 3 ? T.causes[i + 1] - 6 : T.rows[0] - 9;
              if (f < at || f > until + 12) return null;
              const inP = tw(f, at, at + 10);
              const outP = tw(f, until, until + 8, Easing.in(Easing.cubic));
              return (
                <React.Fragment key={c.n}>
                  <div style={{position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 620, lineHeight: 1, color: 'transparent', WebkitTextStroke: `4px ${c.color}`, opacity: 0.35 * inP * (1 - outP), transform: `translateX(${(1 - inP) * 500 - outP * 600}px) skewX(${(1 - inP) * -20 + outP * 20}deg)`}}>
                    {c.n}
                  </div>
                  <Slam f={f} at={at} until={until} y={960} size={140} color={c.color} glitch={hitEnv(f, at, 8) * 0.6}>
                    {c.title}
                  </Slam>
                  <Small f={f} at={at + 10} until={until} y={1200} size={40}>
                    {c.sub.toUpperCase()}
                  </Small>
                  <SpeedLines f={f} at={at} color={c.color} len={20} />
                </React.Fragment>
              );
            })}
            <div style={{position: 'absolute', left: 340, right: 340, top: 1500, display: 'flex', gap: 20, opacity: 1 - tw(f, T.rows[0] - 9, T.rows[0])}}>
              {CAUSES.map((c, i) => (
                <div key={c.n} style={{flex: 1, height: 10, borderRadius: 5, background: f >= T.causes[i] ? c.color : 'rgba(255,255,255,.15)', boxShadow: f >= T.causes[i] ? `0 0 20px ${c.color}` : 'none'}} />
              ))}
            </div>
          </>
        )}

        {/* 7. how to check: fly through the settings path */}
        {inRange(f, T.rows[0], T.fix[0] + 10) && (
          <>
            <Small f={f} at={T.rows[0]} until={T.fix[0] - 9} y={300} size={44} color="#fff">
              HOW TO CHECK
            </Small>
            {ROWS.map((r, i) => {
              const at = T.rows[i];
              const until = i < 3 ? T.rows[i + 1] - 3 : T.file - 4;
              return (
                <Slam key={r} f={f} at={at} until={until} y={860} size={118} color={i === 3 ? BLUE : '#fff'}>
                  {r}
                </Slam>
              );
            })}
            <div style={{position: 'absolute', left: 60, right: 60, top: 1420, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 36, lineHeight: 1.5, color: 'rgba(255,255,255,.7)', opacity: 1 - tw(f, T.fix[0] - 9, T.fix[0])}}>
              {['Settings', 'Privacy & Security', 'Analytics & Improvements', 'Analytics Data'].map((r, i) =>
                f >= T.rows[i] ? (
                  <span key={r} style={{color: i === Math.min(3, Math.floor((f - T.rows[0]) / 15)) ? '#fff' : undefined}}>
                    {i > 0 && <span style={{color: BLUE}}>{'  ›  '}</span>}
                    {r}
                  </span>
                ) : null,
              )}
            </div>
            <Small f={f} at={T.file} until={T.fix[0] - 9} y={720} size={40}>
              LOOK FOR
            </Small>
            <Slam f={f} at={T.file} until={T.fix[0] - 9} y={900} size={96} color={RED} font={MONO} spacing="0" glitch={Math.max(hitEnv(f, T.file, 10), (f - T.file) % 24 < 3 ? 0.6 : 0)}>
              panic-full
            </Slam>
            <Small f={f} at={T.file + 8} until={T.fix[0] - 9} y={1010} size={36} color="rgba(255,255,255,.6)">
              -2026-10-01-104512.ips
            </Small>
          </>
        )}

        {/* 8. what to do */}
        {inRange(f, T.fix[0], T.final + 10) && (
          <>
            <Slam f={f} at={T.fix[0]} until={T.fix[1] - 6} y={800} size={170} color={GREEN}>
              RARE?
            </Slam>
            <Slam f={f} at={T.fix[0] + 6} until={T.fix[1] - 6} y={1000} size={170}>
              RELAX.
            </Slam>
            <Slam f={f} at={T.fix[1]} until={T.fix[2] - 6} y={900} size={170}>
              {'UPDATE\niOS.'}
            </Slam>
            <Slam f={f} at={T.fix[2]} until={T.fix[3] - 6} y={900} size={170}>
              {'BACK IT\nUP.'}
            </Slam>
            <Slam f={f} at={T.fix[3]} until={T.final - 9} y={640} size={120} color={RED} glitch={hitEnv(f, T.fix[3], 10)}>
              {'KEEPS\nRESTARTING?'}
            </Slam>
            <Slam f={f} at={T.fix[4]} until={T.final - 9} y={960} size={100}>
              {'LIKELY\nHARDWARE.'}
            </Slam>
            <Slam f={f} at={T.fix[5]} until={T.final - 9} y={1260} size={100} color={GREEN}>
              {'GET IT\nCHECKED.'}
            </Slam>
          </>
        )}

        {/* 9. final */}
        {f >= T.final && (
          <>
            <Slam f={f} at={T.final} y={800} size={200} glitch={hitEnv(f, T.final, 14)}>
              KERNEL
            </Slam>
            <Slam f={f} at={T.final + 4} y={1000} size={220} color={RED} glitch={hitEnv(f, T.final + 4, 14)}>
              PANIC
            </Slam>
            <Slam f={f} at={T.final + 24} y={1210} size={110} color={BLUE}>
              EXPLAINED.
            </Slam>
            <Burst f={f} at={T.final} colors={[RED, BLUE, '#fff', CYAN]} n={130} />
            <Ring f={f} at={T.final} />
            <SpeedLines f={f} at={T.final} len={40} />
          </>
        )}
      </AbsoluteFill>

      {/* lens flares on the big hits */}
      <Flare f={f} at={T.dies} y={1620} color={RED} />
      <Flare f={f} at={T.title} y={870} color={RED} />
      <Flare f={f} at={T.red} y={1135} color={RED} />
      <Flare f={f} at={T.drop} y={900} color="#ffffff" />
      {T.causes.map((h, i) => (
        <Flare key={h} f={f} at={h} y={960} color={CAUSES[i].color} />
      ))}
      <Flare f={f} at={T.file} y={900} color={RED} />
      <Flare f={f} at={T.fix[3]} y={640} color={RED} />
      <Flare f={f} at={T.final} y={900} color={BLUE} />
      {/* cinematic bars close in before the drop and the ending */}
      {[0, 1].map((k) => {
        const h = 230 * Math.max(tw(f, T.but, T.zoomIn) * (1 - tw(f, T.drop, T.drop + 8)), tw(f, 1170, T.final) * (1 - tw(f, T.final, T.final + 10)));
        return <div key={k} style={{position: 'absolute', left: 0, right: 0, height: h, [k ? 'bottom' : 'top']: 0, background: '#000'}} />;
      })}
      {/* overlays */}
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.75, mixBlendMode: 'overlay'}} />
      <AbsoluteFill style={{background: `repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0px, rgba(0,0,0,.18) 2px, transparent 2px, transparent 5px)`, opacity: 0.5}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 47%, transparent 50%, rgba(0,0,0,.7) 100%)'}} />
      {/* film grain: pre-rendered noise frames (much cheaper than an SVG turbulence filter) */}
      <Img src={staticFile(`kp/grain${f % 6}.png`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1, mixBlendMode: 'overlay'}} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(blackout, tw(f, T.end - 30, T.end), 1 - tw(f, 0, 8))}} />
    </AbsoluteFill>
  );
};
