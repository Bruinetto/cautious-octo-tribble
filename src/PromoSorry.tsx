import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Promo, PROMO_DURATION} from './Promo';

// "Sorry" intro (3.5s), the same promo moved to the next weekend, then a "GET READY." end card (3.5s).
// One epic soundtrack for the whole video: scripts/make_music_sorry_epic.py
// 16:00 Italy is still 10:00 AM New York on 16–18 Oct 2026 (Europe leaves summer time on 25 Oct, the US on 1 Nov).
const INTRO = 105;
const OUTRO = 105;
export const PROMO_SORRY_DURATION = INTRO + PROMO_DURATION + OUTRO;
const NEW_DAYS: [string, string, string] = ['FRIDAY 16 OCTOBER', 'SATURDAY 17 OCTOBER', 'SUNDAY 18 OCTOBER'];

const FONT = "'DM Sans', sans-serif";
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const tw = (f: number, a: number, b: number, e = inOut) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});

const Line: React.FC<{p: number; o: number; children: React.ReactNode; style?: React.CSSProperties}> = ({p, o, children, style}) => (
  <div style={{opacity: p * (1 - o), transform: `translateY(${(1 - p) * 26 - o * 26}px)`, filter: `blur(${(1 - p) * 10 + o * 12}px)`, ...style}}>
    {children}
  </div>
);

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const vertical = height > width;
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);

  const exit = tw(f, INTRO - 14, INTRO);
  const sorryP = tw(f, 14, 40, out);
  const sorryTrack = (1 - sorryP) * 0.3;
  const lineP = tw(f, 40, 58, out);
  const newP = tw(f, 64, 80, out);
  const glow = tw(f, 0, 50, out) * (1 - exit);
  const breathe = 1 + Math.sin(f / 14) * 0.03;
  const big = vertical ? 190 : 230;
  const small = vertical ? 44 : 44;

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          opacity: glow * 0.9,
          background: `radial-gradient(ellipse ${vertical ? 140 : 90}% ${(vertical ? 30 : 40) * breathe}% at 50% 100%, #3a3f4a 0%, #15171c 45%, transparent 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontFamily: FONT,
          color: '#fff',
          paddingBottom: vertical ? 200 : 80,
        }}
      >
        <Line p={sorryP} o={exit}>
          <div style={{fontWeight: 700, fontSize: big, letterSpacing: `${-0.03 + sorryTrack}em`, lineHeight: 1}}>Sorry.</div>
        </Line>
        <Line p={lineP} o={exit} style={{marginTop: vertical ? 56 : 44}}>
          <div style={{fontWeight: 500, fontSize: small * 1.2, color: 'rgba(255,255,255,.75)'}}>We needed a little more time.</div>
        </Line>
        <Line p={newP} o={exit} style={{marginTop: vertical ? 40 : 30}}>
          <div style={{fontWeight: 700, fontSize: small, letterSpacing: '0.3em', color: 'rgba(255,255,255,.9)'}}>NEW DATES</div>
        </Line>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const COLORS = ['#22d3ee', '#ff3b3b', '#2f6bff'];
const sp = (f: number, delay: number, damping = 13, stiffness = 140) => spring({frame: f - delay, fps: 30, config: {damping, stiffness, mass: 1}});
const env = (f: number, at: number, decay: number) => (f < at ? 0 : Math.exp(-(f - at) / decay));

// 16.5s: big hit, "GET READY." slams in; taiko accents at +0.75s and +1.5s light up the dates
const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const vertical = height > width;
  const s = sp(f, 0);
  const end = tw(f, OUTRO - 22, OUTRO);
  const shake = env(f, 0, 7) * 22 + env(f, 22, 5) * 8 + env(f, 45, 5) * 10;
  const sx = Math.sin(f * 2.7) * shake, sy = Math.cos(f * 3.3) * shake * 0.7;
  const flash = env(f, 0, 5) * 0.85 + env(f, 22, 4) * 0.2 + env(f, 45, 4) * 0.25;
  const big = vertical ? 168 : 230;
  const small = vertical ? 42 : 44;
  const dates = ['16', '17', '18'];
  const glowH = (vertical ? 46 : 60) * Math.min(1, s) * (1 + Math.sin(f / 10) * 0.04);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${1 + env(f, 0, 12) * 0.05 + tw(f, 0, OUTRO, Easing.linear) * 0.05})`}}>
        {COLORS.map((c, i) => (
          <AbsoluteFill
            key={c}
            style={{
              opacity: (1 - end) * Math.min(1, s),
              background: `radial-gradient(ellipse ${vertical ? 60 : 45}% ${Math.max(4, glowH)}% at ${18 + i * 32}% 100%, ${c} 0%, ${c}55 40%, transparent 100%)`,
            }}
          />
        ))}
        <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, color: '#fff', textAlign: 'center', paddingBottom: vertical ? 200 : 80}}>
          <div
            style={{
              fontWeight: 700,
              fontSize: big,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              letterSpacing: `${interpolate(Math.min(1, s), [0, 1], [0.25, -0.03])}em`,
              opacity: Math.min(1, s * 1.6) * (1 - end),
              transform: `scale(${interpolate(s, [0, 1], [1.6, 1])})`,
              filter: `blur(${(1 - Math.min(1, s)) * 18 + end * 12}px)`,
              textShadow: `0 0 ${40 + env(f, 0, 10) * 120}px rgba(255,255,255,${0.3 + env(f, 0, 10) * 0.5})`,
            }}
          >
            GET READY.
          </div>
          <div style={{marginTop: vertical ? 60 : 48, display: 'flex', alignItems: 'baseline', gap: vertical ? 26 : 34, fontWeight: 700, fontSize: small * 1.5, opacity: 1 - end}}>
            {dates.map((d, i) => {
              const q = sp(f, 18 + i * 8, 12, 180);
              return (
                <span key={d} style={{color: COLORS[i], opacity: Math.min(1, q), transform: `translateY(${(1 - Math.min(1, q)) * 30}px) scale(${interpolate(q, [0, 1], [1.5, 1])})`, display: 'inline-block', textShadow: `0 0 30px ${COLORS[i]}aa`}}>
                  {d}
                </span>
              );
            })}
            <span style={{fontSize: small, letterSpacing: '0.3em', color: 'rgba(255,255,255,.85)', opacity: tw(f, 44, 58, out)}}>OCTOBER</span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', mixBlendMode: 'overlay', opacity: flash}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle, transparent 55%, rgba(0,0,0,.6) 100%)'}} />
    </AbsoluteFill>
  );
};

export const PromoSorry: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Audio src={staticFile('music-sorry-epic.wav')} />
    <Sequence durationInFrames={INTRO}>
      <Intro />
    </Sequence>
    <Sequence from={INTRO} durationInFrames={PROMO_DURATION}>
      <Promo days={NEW_DAYS} music={false} />
    </Sequence>
    <Sequence from={INTRO + PROMO_DURATION}>
      <Outro />
    </Sequence>
  </AbsoluteFill>
);
