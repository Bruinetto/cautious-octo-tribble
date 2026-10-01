import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  continueRender,
  delayRender,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const PROMO_DURATION = 390; // 13s @ 30fps
const FPS = 30;
const FONT = "'DM Sans', sans-serif";

// All three events at 16:00 Italian time (CEST, UTC+2) = 10:00 AM New York (EDT), weekend of 9–11 Oct 2026.
// Other cities converted with the IANA tz database.
// Main time shown big: New York. The others rotate underneath, one at a time.
const MAIN = {city: 'NEW YORK', time: '10:00 AM'};
const ZONES = [
  {city: 'ITALY', time: '16:00'},
  {city: 'LONDON', time: '15:00'},
  {city: 'LOS ANGELES', time: '7:00 AM'},
  {city: 'TOKYO', time: '23:00'},
];

type Scene = {
  start: number;
  len: number;
  color: string;
  deep: string;
  title: React.ReactNode;
  day: string;
};

const CYAN = '#22d3ee';
const RED = '#ff3b3b';
const BLUE = '#2f6bff';

const SCENES: Scene[] = [
  {
    start: 0,
    len: 120,
    color: CYAN,
    deep: '#0b5d6b',
    title: (
      <>
        barcly <span style={{color: CYAN, textShadow: `0 0 40px ${CYAN}88`}}>2.0</span>
      </>
    ),
    day: 'FRIDAY 9 OCTOBER',
  },
  {
    start: 120,
    len: 120,
    color: RED,
    deep: '#6b0b0b',
    title: (
      <>
        minitravels <span style={{color: RED, textShadow: `0 0 40px ${RED}88`}}>2.0</span>
      </>
    ),
    day: 'SATURDAY 10 OCTOBER',
  },
  {start: 240, len: 150, color: BLUE, deep: '#0b236b', title: <>One more thing</>, day: 'SUNDAY 11 OCTOBER'},
];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const tw = (f: number, a: number, b: number, e = inOut) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});
const sp = (f: number, delay = 0, damping = 14, stiffness = 120) =>
  spring({frame: f - delay, fps: FPS, config: {damping, stiffness, mass: 1}});

const Line: React.FC<{p: number; o?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
  p,
  o = 0,
  style,
  children,
}) => (
  <div
    style={{
      opacity: p * (1 - o),
      transform: `translateY(${(1 - p) * 30 - o * 30}px)`,
      filter: `blur(${(1 - p) * 10 + o * 10}px)`,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Promo: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const vertical = height > width;
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);

  const idx = f >= 240 ? 2 : f >= 120 ? 1 : 0;
  const sc = SCENES[idx];
  const t = f - sc.start;
  const last = idx === 2;

  // before "One more thing" the screen fades to black (music is silent 7.5–8s)
  const delay = 0;
  const lt = t - delay;

  // --- gradient at the bottom ---
  const prev = SCENES[Math.max(0, idx - 1)];
  const colorMix = idx === 1 ? tw(lt, 0, 14) : 1;
  const glow = interpolateColors(colorMix, [0, 1], [prev.color, sc.color]);
  const deep = interpolateColors(colorMix, [0, 1], [prev.deep, sc.deep]);
  const rise = last ? tw(lt, 0, 40, out) : idx === 0 ? tw(t, 0, 24, out) : 1;
  const preDrop = tw(f, 226, 240); // fade to black before the last scene
  const breathe = 1 + Math.sin(f / 14) * 0.03;
  const gH = Math.max(6, (vertical ? 48 : 62) * rise * breathe);
  const gradOpacity = (last ? (lt < 0 ? 0 : Math.min(1, rise * 3)) : 1) * (idx === 1 ? 1 - preDrop : 1) * (1 - tw(f, 372, 390));

  // --- text timing (local) ---
  const exit = last ? tw(f, 372, 390) : tw(t, sc.len - 12, sc.len);
  const titleP = last ? tw(lt, 6, 36, out) : tw(t, 4, 22, out);
  const titleTrack = (1 - titleP) * 0.25;
  const dayP = tw(lt, 30, 44, out);
  const timeP = sp(lt, 40, 13, 140);
  const zoneStart = 60;
  const zoneLen = 15;
  const zi = Math.min(ZONES.length - 1, Math.max(0, Math.floor((lt - zoneStart) / zoneLen)));
  const zl = lt - zoneStart - zi * zoneLen;
  const zIn = lt >= zoneStart ? tw(zl, 0, 6, out) : 0;
  const zOut = zi < ZONES.length - 1 ? tw(zl, zoneLen - 4, zoneLen) : 0;
  const hitFlash = [0, 120, 240].reduce((a, h) => Math.max(a, f < h ? 0 : Math.exp(-(f - h) / 5)), 0);

  const titleSize = vertical ? 126 : 190;
  const small = vertical ? 40 : 42;
  const timeSize = vertical ? 140 : 140;

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Audio src={staticFile('music-promo.wav')} />

      {/* colour gradient rising from the bottom */}
      <AbsoluteFill
        style={{
          opacity: gradOpacity,
          background: `radial-gradient(ellipse ${vertical ? 140 : 90}% ${gH}% at 50% 100%, ${glow} 0%, ${deep} 45%, transparent 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: gradOpacity * 0.5,
          background: `linear-gradient(to top, ${glow}55 0%, transparent ${gH * 0.9}%)`,
        }}
      />

      {/* content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontFamily: FONT,
          color: '#fff',
          paddingBottom: vertical ? 260 : 120,
        }}
      >
        <Line p={titleP} o={exit}>
          <div
            style={{
              fontWeight: 700,
              fontSize: last ? titleSize * 0.82 : titleSize,
              letterSpacing: `${-0.03 + titleTrack}em`,
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {sc.title}
          </div>
        </Line>

        <Line p={dayP} o={exit} style={{marginTop: vertical ? 70 : 50}}>
          <div style={{fontWeight: 700, fontSize: small, letterSpacing: '0.3em', color: 'rgba(255,255,255,.75)'}}>
            {sc.day}
          </div>
        </Line>

        <div
          style={{
            marginTop: 18,
            opacity: Math.min(1, timeP) * (1 - exit),
            transform: `scale(${0.7 + 0.3 * timeP})`,
            filter: `blur(${exit * 10}px)`,
            display: 'flex',
            flexDirection: vertical ? 'column' : 'row',
            alignItems: vertical ? 'center' : 'baseline',
            gap: vertical ? 4 : 22,
          }}
        >
          <span style={{fontWeight: 700, fontSize: timeSize, letterSpacing: '-0.02em', color: sc.color}}>{MAIN.time}</span>
          <span style={{fontWeight: 700, fontSize: small, letterSpacing: '0.25em'}}>{MAIN.city}</span>
        </div>

        {/* other time zones, one at a time */}
        <div style={{height: small * 1.6, marginTop: 14, opacity: 1 - exit}}>
          <div
            style={{
              opacity: zIn * (1 - zOut),
              transform: `translateY(${(1 - zIn) * 20 - zOut * 20}px)`,
              fontSize: small,
              fontWeight: 500,
              color: 'rgba(255,255,255,.7)',
              letterSpacing: '0.12em',
            }}
          >
            <span style={{fontWeight: 700, color: '#fff'}}>{ZONES[zi].time}</span>
            {'  '}
            {ZONES[zi].city}
          </div>
        </div>
      </AbsoluteFill>

      {/* subtle flash on the music hits */}
      <AbsoluteFill style={{background: sc.color, mixBlendMode: 'screen', opacity: hitFlash * 0.25}} />
    </AbsoluteFill>
  );
};
