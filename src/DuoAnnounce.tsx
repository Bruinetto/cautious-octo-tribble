import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const DUO_DURATION = 390; // 13s @ 30fps
const FONT = "'DM Sans', sans-serif";
const CYAN = '#22d3ee';
const RED = '#ff3b3b';

// Scene starts on the 120 BPM grid of scripts/make_music_duo.py
const S = {apps: 0, duo: 120, but: 210, barcly: 240, end: 390};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const tw = (f: number, a: number, b: number, e = inOut) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});
const hitEnv = (f: number, at: number, decay = 5) => (f < at ? 0 : Math.exp(-(f - at) / decay));

/** Blur/slide in, blur/slide out */
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
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

const Glow: React.FC<{color: string; x: number; h: number; opacity: number; wide: number}> = ({color, x, h, opacity, wide}) => (
  <AbsoluteFill
    style={{
      opacity,
      background: `radial-gradient(ellipse ${wide}% ${Math.max(6, h)}% at ${x}% 100%, ${color} 0%, ${color}55 40%, transparent 100%)`,
    }}
  />
);

export const DuoAnnounce: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const vertical = height > width;
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);

  const title = vertical ? 126 : 190;
  const small = vertical ? 44 : 46;
  const breathe = 1 + Math.sin(f / 14) * 0.03;

  // ---- glows ----
  const appsGlow = tw(f, 0, 24, out) * (1 - tw(f, S.but - 12, S.but + 4));
  const twoTone = tw(f, S.duo, S.duo + 20); // cyan + red meet in the middle for iPhone Duo
  const cyanX = interpolate(twoTone, [0, 1], [18, 38]);
  const redX = interpolate(twoTone, [0, 1], [82, 62]);
  const glowH = (vertical ? 45 : 60) * breathe;
  const barclyGlow = tw(f, S.barcly, S.barcly + 30, out) * (1 - tw(f, S.end - 18, S.end));

  // ---- scene 1: apps ----
  const a1 = tw(f, 4, 20, out);
  const a2 = tw(f, 12, 28, out);
  const a3 = tw(f, 40, 56, out);
  const aOut = tw(f, S.duo - 12, S.duo);

  // ---- scene 2: iPhone Duo ----
  const d1 = tw(f, S.duo, S.duo + 22, out);
  const dTrack = (1 - d1) * 0.3;
  const d2 = tw(f, S.duo + 30, S.duo + 46, out);
  const dOut = tw(f, S.but - 12, S.but);

  // ---- scene 3: But... ----
  const b1 = tw(f, S.but + 2, S.but + 14, out);
  const bOut = tw(f, S.barcly - 6, S.barcly);

  // ---- scene 4: barcly already compatible ----
  const c1 = tw(f, S.barcly, S.barcly + 18, out);
  const c2 = tw(f, S.barcly + 14, S.barcly + 30, out);
  const c3 = tw(f, S.barcly + 30, S.barcly + 46, out);
  const cOut = tw(f, S.end - 18, S.end);
  const alreadyPulse = hitEnv(f, S.barcly + 60, 10) + hitEnv(f, S.barcly + 120, 10);

  const flash = Math.max(hitEnv(f, 0), hitEnv(f, S.duo), hitEnv(f, S.barcly, 6));
  const flashColor = f >= S.barcly ? CYAN : '#ffffff';

  const center: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontFamily: FONT,
    color: '#fff',
    paddingBottom: vertical ? 220 : 100,
  };

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Audio src={staticFile('music-duo.wav')} />

      <Glow color={CYAN} x={cyanX} h={glowH * appsGlow} opacity={appsGlow} wide={vertical ? 110 : 70} />
      <Glow color={RED} x={redX} h={glowH * appsGlow} opacity={appsGlow} wide={vertical ? 110 : 70} />
      <Glow color={CYAN} x={50} h={glowH * 1.1 * barclyGlow} opacity={barclyGlow} wide={vertical ? 150 : 95} />

      {/* scene 1 */}
      {f < S.duo && (
        <AbsoluteFill style={center}>
          <Line p={a1} o={aOut}>
            <div style={{fontWeight: 700, fontSize: title, letterSpacing: '-0.03em', lineHeight: 1.05, color: CYAN}}>barcly</div>
          </Line>
          <Line p={a2} o={aOut}>
            <div style={{fontWeight: 700, fontSize: title, letterSpacing: '-0.03em', lineHeight: 1.05, color: RED}}>
              minitravels
            </div>
          </Line>
          <Line p={a3} o={aOut} style={{marginTop: vertical ? 50 : 36}}>
            <div style={{fontWeight: 500, fontSize: small * 1.3, color: 'rgba(255,255,255,.8)'}}>are coming to</div>
          </Line>
        </AbsoluteFill>
      )}

      {/* scene 2 */}
      {f >= S.duo && f < S.but && (
        <AbsoluteFill style={center}>
          <Line p={d1} o={dOut}>
            <div
              style={{
                fontWeight: 700,
                fontSize: title * 1.15,
                letterSpacing: `${-0.03 + dTrack}em`,
                textShadow: '0 0 60px rgba(255,255,255,.35)',
              }}
            >
              iPhone Duo
            </div>
          </Line>
          <Line p={d2} o={dOut} style={{marginTop: vertical ? 50 : 36}}>
            <div style={{fontWeight: 700, fontSize: small, letterSpacing: '0.25em', color: 'rgba(255,255,255,.75)'}}>
              DEEP INTEGRATION
            </div>
            <div style={{fontWeight: 500, fontSize: small, color: 'rgba(255,255,255,.55)', marginTop: 10}}>Coming soon</div>
          </Line>
        </AbsoluteFill>
      )}

      {/* scene 3 */}
      {f >= S.but && f < S.barcly && (
        <AbsoluteFill style={center}>
          <Line p={b1} o={bOut}>
            <div style={{fontWeight: 500, fontSize: title * 0.8, letterSpacing: '-0.02em'}}>But…</div>
          </Line>
        </AbsoluteFill>
      )}

      {/* scene 4 */}
      {f >= S.barcly && (
        <AbsoluteFill style={center}>
          <Line p={c1} o={cOut}>
            <div style={{fontWeight: 700, fontSize: title * 1.15, letterSpacing: '-0.03em', lineHeight: 1}}>barcly</div>
          </Line>
          <Line p={c2} o={cOut} style={{marginTop: vertical ? 40 : 28}}>
            <div style={{fontWeight: 700, fontSize: small * 1.5, letterSpacing: '-0.01em'}}>
              is{' '}
              <span
                style={{
                  color: CYAN,
                  textShadow: `0 0 ${30 + alreadyPulse * 40}px ${CYAN}${alreadyPulse > 0.3 ? 'ff' : 'aa'}`,
                }}
              >
                already
              </span>{' '}
              compatible
            </div>
          </Line>
          <Line p={c3} o={cOut} style={{marginTop: 14}}>
            <div style={{fontWeight: 500, fontSize: small, letterSpacing: '0.2em', color: 'rgba(255,255,255,.7)'}}>
              WITH IPHONE DUO
            </div>
          </Line>
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{background: flashColor, mixBlendMode: 'screen', opacity: flash * 0.22}} />
    </AbsoluteFill>
  );
};
