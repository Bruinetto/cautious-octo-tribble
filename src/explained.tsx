/**
 * Shared building blocks for the "Explained" series (vertical 1080x1920, 30fps):
 * an Apple-like minimal intro (headlines, rounded boxes, pills) and a clean, epic
 * second half (slams, rounded cards, a big staggered title with shockwaves).
 * The series theme (public/kp/music-v3.wav) puts its hits on the frames in SERIES_T.
 */
import React from 'react';
import {Easing, interpolate, spring} from 'remotion';

export const FPS = 30;
export const FONT = "'DM Sans', sans-serif";
export const MONO = "'DejaVu Sans Mono', 'Liberation Mono', monospace";
export const C = {
  text: '#f5f5f7',
  grey: '#86868b',
  box: '#1c1c1e',
  line: '#2c2c2e',
  blue: '#0a84ff',
  red: '#ff453a',
  green: '#30d158',
  orange: '#ff9f0a',
  yellow: '#ffd60a',
  purple: '#bf5af2',
};

/** Hit frames of the series theme (scripts/make_music_kp_v3.py) */
export const SERIES_T = {
  intro: [6, 75, 150, 225],
  introOut: 282,
  drop: 300,
  two: [360, 390],
  cards: [420, 480, 540, 600],
  spot: 660,
  parts: [690, 720, 750],
  fix: [780, 810, 840, 870, 900, 930],
  final: 960,
  end: 1080,
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
export const tw = (f: number, a: number, b: number, e = ease) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});
export const sp = (f: number, at: number, damping = 20, stiffness = 120) =>
  spring({frame: f - at, fps: FPS, config: {damping, stiffness, mass: 1}});
export const hitEnv = (f: number, at: number, decay = 7) => (f < at ? 0 : Math.exp(-(f - at) / decay));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** Apple-style headline: soft fade + rise */
export const Headline: React.FC<{f: number; at: number; until: number; y: number; children: React.ReactNode; size?: number}> = ({
  f,
  at,
  until,
  y,
  children,
  size = 66,
}) => {
  if (f < at || f > until + 12) return null;
  const p = tw(f, at, at + 18);
  const o = tw(f, until, until + 10);
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 80,
        top: y,
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.15,
        letterSpacing: '-0.02em',
        color: C.text,
        opacity: p * (1 - o),
        transform: `translateY(${(1 - p) * 24 - o * 12}px)`,
      }}
    >
      {children}
    </div>
  );
};

export const Pill: React.FC<{p: number; children: React.ReactNode; color?: string; size?: number}> = ({p, children, color, size = 38}) => (
  <div
    style={{
      padding: '18px 36px',
      borderRadius: 999,
      background: color ? `color-mix(in srgb, ${color} 18%, ${C.box})` : C.box,
      border: `2px solid ${color ?? C.line}`,
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: size,
      color: C.text,
      opacity: Math.min(1, p),
      transform: `translateY(${(1 - p) * 20}px) scale(${0.9 + 0.1 * Math.min(1, p)})`,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

/** A centred row of pills that fades out at `until` */
export const PillRow: React.FC<{f: number; until: number; y: number; children: React.ReactNode; gap?: number; wrap?: boolean}> = ({f, until, y, children, gap = 18, wrap}) => (
  <div style={{position: 'absolute', left: 60, right: 60, top: y, display: 'flex', flexWrap: wrap ? 'wrap' : 'nowrap', justifyContent: 'center', gap, opacity: 1 - tw(f, until, until + 10)}}>
    {children}
  </div>
);

/** Big clean slam: springs in from a larger scale, scales through on exit */
export const Slam: React.FC<{
  f: number;
  at: number;
  until?: number;
  y: number;
  size: number;
  color?: string;
  weight?: number;
  font?: string;
  spacing?: string;
  children: React.ReactNode;
}> = ({f, at, until, y, size, color = C.text, weight = 700, font = FONT, spacing = '-0.035em', children}) => {
  const t = f - at;
  if (t < 0 || (until !== undefined && f > until + 8)) return null;
  const s = spring({frame: t, fps: FPS, config: {damping: 16, stiffness: 260, mass: 0.8}});
  const exit = until !== undefined ? tw(f, until, until + 8, Easing.in(Easing.cubic)) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        right: 40,
        top: y,
        textAlign: 'center',
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 0.98,
        letterSpacing: spacing,
        whiteSpace: 'pre-line',
        color,
        opacity: Math.min(1, t / 3) * (1 - exit),
        transform: `translateY(-50%) scale(${mix(1.6, 1, s) * (1 + exit * 0.35)})`,
      }}
    >
      {children}
    </div>
  );
};

/** Small letter-spaced section label */
export const Label: React.FC<{f: number; at: number; until: number; y: number; children: React.ReactNode; color?: string}> = ({f, at, until, y, children, color = C.grey}) => {
  if (f < at || f > until + 10) return null;
  const p = tw(f, at, at + 12);
  const o = tw(f, until, until + 8);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 38, letterSpacing: '0.28em', color, opacity: p * (1 - o), transform: `translateY(${(1 - p) * 16}px)`}}>
      {children}
    </div>
  );
};

/**
 * The big title moment: first word drops in letter by letter, second word explodes
 * in letter by letter, with a red burst and two clean shockwaves.
 */
export const BigTitle: React.FC<{
  f: number;
  at: number;
  until?: number;
  first: string;
  second: string;
  firstSize?: number;
  secondSize?: number;
  color?: string;
}> = ({f, at, until, first, second, firstSize = 190, secondSize = 220, color = C.red}) => {
  const t = f - at;
  if (t < -2 || (until !== undefined && f > until + 8)) return null;
  const exit = until !== undefined ? tw(f, until, until + 8, Easing.in(Easing.cubic)) : 0;
  const letters = (word: string, y: number, size: number, col: string, delay: number, fromTop: boolean) => (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', transform: 'translateY(-50%)'}}>
      {word.split('').map((ch, i) => {
        const lt = t - delay - i * 1.6;
        const s = spring({frame: lt, fps: FPS, config: {damping: 11, stiffness: 240, mass: 0.7}});
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: size,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              color: col,
              opacity: lt >= 0 ? Math.min(1, s * 2) * (1 - exit) : 0,
              transform: fromTop ? `translateY(${(1 - s) * -260}px) scale(${1 + exit * 0.35})` : `scale(${mix(2.8, 1, s) * (1 + exit * 0.35)})`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
  const ring = (delay: number, col: string, width: number) => {
    const p = tw(f, at + delay, at + delay + 32, Easing.out(Easing.cubic));
    if (p <= 0 || p >= 1) return null;
    const r = 60 + p * 1100;
    return <div style={{position: 'absolute', left: 540 - r, top: 960 - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `${width * (1 - p) + 1}px solid ${col}`, opacity: 1 - p}} />;
  };
  const burst = hitEnv(f, at + 4, 14);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 540 - 900,
          top: 960 - 900,
          width: 1800,
          height: 1800,
          borderRadius: '50%',
          background: `radial-gradient(circle, color-mix(in srgb, ${color} 55%, transparent) 0%, transparent 60%)`,
          opacity: burst * (1 - exit),
          transform: `scale(${0.4 + (1 - burst) * 0.8})`,
        }}
      />
      {ring(4, color, 14)}
      {ring(9, '#ffffff', 6)}
      {letters(first, 860, firstSize, C.text, 0, true)}
      {letters(second, 1050, secondSize, color, 4, false)}
    </>
  );
};

/** Rounded card that slides in from the right and out to the left */
export const Card: React.FC<{f: number; at: number; until: number; n: string; title: string; sub: string; color: string; titleSize?: number}> = ({
  f,
  at,
  until,
  n,
  title,
  sub,
  color,
  titleSize = 150,
}) => {
  if (f < at || f > until + 10) return null;
  const s = spring({frame: f - at, fps: FPS, config: {damping: 18, stiffness: 200, mass: 0.9}});
  const o = tw(f, until, until + 8, Easing.in(Easing.cubic));
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        width: 900,
        top: 560,
        height: 760,
        borderRadius: 64,
        background: C.box,
        border: `2px solid ${C.line}`,
        padding: 70,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: Math.min(1, s * 1.5) * (1 - o),
        transform: `translateX(${(1 - s) * 700 - o * 700}px) scale(${mix(0.9, 1, Math.min(1, s))})`,
        boxShadow: `0 0 ${60 + hitEnv(f, at, 10) * 80}px color-mix(in srgb, ${color} 25%, transparent)`,
      }}
    >
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 64, color}}>{n}</div>
      <div>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: titleSize, lineHeight: 0.95, letterSpacing: '-0.04em', color: C.text, whiteSpace: 'pre-line'}}>{title}</div>
        <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 46, color: C.grey, marginTop: 30}}>{sub}</div>
      </div>
    </div>
  );
};

/** Progress dots under the cards */
export const Dots: React.FC<{f: number; starts: number[]; colors: string[]; until: number; y: number}> = ({f, starts, colors, until, y}) => {
  if (f < starts[0] || f > until + 8) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', gap: 14, opacity: 1 - tw(f, until - 8, until)}}>
      {starts.map((s, i) => {
        const active = f >= s && (i === starts.length - 1 || f < starts[i + 1]);
        return <div key={s} style={{width: active ? 48 : 14, height: 14, borderRadius: 7, background: f >= s ? colors[i] : C.line}} />;
      })}
    </div>
  );
};

/** Italic brand signature */
export const Signature: React.FC<{f: number; at: number; y?: number}> = ({f, at, y = 1500}) => {
  if (f < at) return null;
  const p = tw(f, at, at + 18);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: FONT, fontStyle: 'italic', fontSize: 54, color: C.text, opacity: p, transform: `translateY(${(1 - p) * 16}px)`}}>
      fantexinsta
    </div>
  );
};
