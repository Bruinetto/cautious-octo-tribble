import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Promo, PROMO_DURATION} from './Promo';

// "Sorry" intro (3.5s), then the same promo moved to the next weekend.
// 16:00 Italy is still 10:00 AM New York on 16–18 Oct 2026 (Europe leaves summer time on 25 Oct, the US on 1 Nov).
const INTRO = 105;
export const PROMO_SORRY_DURATION = INTRO + PROMO_DURATION;
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
      <Audio src={staticFile('music-sorry.wav')} />
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

export const PromoSorry: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence durationInFrames={INTRO}>
      <Intro />
    </Sequence>
    <Sequence from={INTRO}>
      <Promo days={NEW_DAYS} />
    </Sequence>
  </AbsoluteFill>
);
