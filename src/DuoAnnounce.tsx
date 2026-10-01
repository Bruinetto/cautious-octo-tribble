import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  continueRender,
  delayRender,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const DUO_DURATION = 420; // 14s @ 30fps
const FPS = 30;
const FONT = "'DM Sans', sans-serif";

const APPS = [
  {name: 'Barcly', color: '#22d3ee', hit: 30, x: 18},
  {name: 'MiniTravels', color: '#ff3b3b', hit: 75, x: 50},
  {name: 'NetLens', color: '#2f6bff', hit: 120, x: 82},
];
// Frames of the soundtrack hits (scripts/make_music_duo.py)
const BUILD = 165;
const DROP = 240;
const FINAL = 330;
const END = 420;
const ROLL = [195, 210, 218, 225, 229, 232, 234, 235];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const tw = (f: number, a: number, b: number, e = inOut) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});
const sp = (f: number, delay: number, damping = 14, stiffness = 180) =>
  spring({frame: f - delay, fps: FPS, config: {damping, stiffness, mass: 1}});
const hitEnv = (f: number, at: number, decay = 6) => (f < at ? 0 : Math.exp(-(f - at) / decay));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

const Glow: React.FC<{color: string; x: number; h: number; w: number; opacity: number}> = ({color, x, h, w, opacity}) =>
  opacity <= 0 ? null : (
    <AbsoluteFill
      style={{
        opacity,
        background: `radial-gradient(ellipse ${w}% ${Math.max(6, h)}% at ${x}% 100%, ${color} 0%, ${color}55 40%, transparent 100%)`,
      }}
    />
  );

/** Bright horizontal light streak that flashes behind a slam */
const Streak: React.FC<{f: number; at: number; y: number; color: string}> = ({f, at, y, color}) => {
  const t = f - at;
  if (t < 0 || t > 24) return null;
  const p = tw(t, 0, 24, out);
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: y - 3,
        width: `${10 + p * 110}%`,
        height: 6,
        transform: 'translateX(-50%)',
        background: `linear-gradient(90deg, transparent, ${color}, #fff, ${color}, transparent)`,
        boxShadow: `0 0 40px 10px ${color}`,
        opacity: 1 - p,
      }}
    />
  );
};

const Burst: React.FC<{f: number; at: number; x: number; y: number; colors: string[]; n?: number; power?: number}> = ({
  f,
  at,
  x,
  y,
  colors,
  n = 90,
  power = 1,
}) => {
  const t = f - at;
  if (t < 0 || t > 75) return null;
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const a = random(`a${at}-${i}`) * Math.PI * 2;
        const speed = (10 + random(`s${at}-${i}`) * 40) * power;
        const life = 30 + random(`l${at}-${i}`) * 45;
        const size = 3 + random(`z${at}-${i}`) * 8;
        const d = speed * 14 * (1 - Math.exp(-t / 12));
        const c = colors[i % colors.length];
        const o = Math.max(0, 1 - t / life);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.cos(a) * d - size / 2,
              top: y + Math.sin(a) * d * 0.8 + 0.04 * t * t - size / 2,
              width: size,
              height: size,
              borderRadius: '50%',
              background: c,
              opacity: o,
              boxShadow: `0 0 ${size * 2}px ${c}`,
            }}
          />
        );
      })}
    </>
  );
};

const Ring: React.FC<{f: number; at: number; x: number; y: number; color?: string}> = ({f, at, x, y, color = '#fff'}) => {
  const p = tw(f, at, at + 40, out);
  if (p <= 0 || p >= 1) return null;
  const r = 50 + p * 1100;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        border: `${mix(6, 1.5, p)}px solid ${color}`,
        boxShadow: `0 0 40px ${color}`,
        opacity: 1 - p,
      }}
    />
  );
};

const Grain: React.FC<{f: number; w: number; h: number}> = ({f, w, h}) => (
  <AbsoluteFill style={{opacity: 0.06, mixBlendMode: 'overlay'}}>
    <svg width={w} height={h}>
      <filter id="g3">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 12} />
      </filter>
      <rect width="100%" height="100%" filter="url(#g3)" />
    </svg>
  </AbsoluteFill>
);

export const DuoAnnounce: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const vertical = height > width;
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);

  const cx = width / 2;
  const cy = height / 2 - (vertical ? 120 : 40);
  const nameSize = vertical ? 132 : 170;
  const lineH = nameSize * 1.12;
  const duoSize = vertical ? 178 : 270;
  const small = vertical ? 44 : 46;

  // ---- camera ----
  const shake =
    APPS.reduce((a, s) => a + hitEnv(f, s.hit, 5) * 12, 0) +
    ROLL.reduce((a, h) => a + hitEnv(f, h, 3) * 3, 0) +
    hitEnv(f, DROP, 9) * 26 +
    hitEnv(f, FINAL, 7) * 14;
  const shakeX = Math.sin(f * 2.7) * shake + Math.sin(f * 5.3) * shake * 0.4;
  const shakeY = Math.cos(f * 3.1) * shake * 0.8;
  const punch = hitEnv(f, DROP, 12) * 0.06 + hitEnv(f, FINAL, 10) * 0.03 + APPS.reduce((a, s) => a + hitEnv(f, s.hit, 8) * 0.02, 0);
  const drift = 1 + tw(f, 0, BUILD + 70, Easing.linear) * 0.06;

  // ---- glows ----
  const fadeToBlack = tw(f, DROP - 18, DROP - 2);
  const breathe = 1 + Math.sin(f / 14) * 0.04;
  const appGlow = (i: number) => tw(f, APPS[i].hit, APPS[i].hit + 16, out) * (1 - fadeToBlack);
  const duoGlow = tw(f, DROP, DROP + 26, out) * (1 - tw(f, END - 20, END));
  const glowH = (vertical ? 46 : 62) * breathe;

  // ---- names (scene 1 + build) ----
  const shrink = tw(f, BUILD, BUILD + 30);
  const groupScale = mix(1, 0.62, shrink);
  const groupY = mix(cy, cy - (vertical ? 230 : 140), shrink);
  const names = APPS.map((a, i) => {
    const s = sp(f, a.hit);
    const y = (i - 1) * lineH;
    return {
      ...a,
      s,
      y,
      opacity: interpolate(f, [a.hit - 1, a.hit + 3], [0, 1], clamp) * (1 - fadeToBlack),
      scale: mix(1.7, 1, s),
      blur: (1 - Math.min(1, s)) * 20,
      flashText: hitEnv(f, a.hit, 6),
    };
  });

  const compatP = tw(f, BUILD + 15, BUILD + 40, out) * (1 - fadeToBlack);
  const compatText = 'are now all compatible with';

  // ---- iPhone Duo ----
  const duoS = sp(f, DROP, 13, 120);
  const duoUp = sp(f, FINAL, 18, 110);
  const duoY = mix(cy, cy - (vertical ? 330 : 190), duoUp);
  const duoScale = mix(1.35, 1, duoS) * mix(1, 0.62, duoUp);
  const endFade = tw(f, END - 20, END);

  // ---- final lockup ----
  const lock = (i: number) => sp(f, FINAL + 4 + i * 5, 15, 160);
  const nowP = tw(f, FINAL + 24, FINAL + 44, out);

  const flash = Math.max(hitEnv(f, DROP, 6) * 0.9, hitEnv(f, FINAL, 5) * 0.5, ...APPS.map((a) => hitEnv(f, a.hit, 4) * 0.3));

  const text: React.CSSProperties = {fontFamily: FONT, color: '#fff', whiteSpace: 'nowrap', position: 'absolute', left: 0, width: '100%', textAlign: 'center'};

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Audio src={staticFile('music-duo.wav')} />

      <AbsoluteFill style={{transform: `translate(${shakeX}px, ${shakeY}px) scale(${drift * (1 + punch)})`}}>
        {/* glows */}
        {APPS.map((a, i) => (
          <Glow key={a.name} color={a.color} x={a.x} h={glowH * appGlow(i)} w={vertical ? 55 : 45} opacity={appGlow(i)} />
        ))}
        {APPS.map((a) => (
          <Glow key={`d-${a.name}`} color={a.color} x={a.x} h={glowH * 1.15 * duoGlow} w={vertical ? 62 : 50} opacity={duoGlow} />
        ))}

        {/* names + streaks */}
        {f < DROP && (
          <div style={{position: 'absolute', inset: 0, transform: `translateY(${groupY - cy}px) scale(${groupScale})`, transformOrigin: `50% ${cy}px`}}>
            {names.map((n) => (
              <React.Fragment key={n.name}>
                <Streak f={f} at={n.hit} y={cy + n.y} color={n.color} />
                <div
                  style={{
                    ...text,
                    top: cy + n.y - nameSize * 0.62,
                    fontWeight: 700,
                    fontSize: nameSize,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.2,
                    color: n.color,
                    opacity: n.opacity,
                    filter: `blur(${n.blur}px)`,
                    transform: `scale(${n.scale})`,
                    textShadow: `0 0 ${30 + n.flashText * 80}px ${n.color}${n.flashText > 0.3 ? 'ff' : '99'}`,
                  }}
                >
                  {n.name}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* "are now all compatible with" */}
        {f >= BUILD && f < DROP && (
          <div style={{...text, top: groupY + lineH * 2 * groupScale - small * 0.3, fontWeight: 500, fontSize: small * 1.35}}>
            {compatText.split('').map((c, i) => {
              const q = Math.min(1, Math.max(0, compatP * (compatText.length + 6) - i) / 6);
              return (
                <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: q, transform: `translateY(${(1 - q) * 18}px)`, filter: `blur(${(1 - q) * 6}px)`}}>
                  {c}
                </span>
              );
            })}
          </div>
        )}

        {/* iPhone Duo */}
        {f >= DROP && (
          <div
            style={{
              ...text,
              top: duoY - duoSize * 0.62,
              fontWeight: 700,
              fontSize: duoSize,
              lineHeight: 1.2,
              letterSpacing: `${mix(0.12, -0.03, Math.min(1, duoS))}em`,
              opacity: Math.min(1, duoS * 1.5) * (1 - endFade),
              filter: `blur(${(1 - Math.min(1, duoS)) * 16 + endFade * 10}px)`,
              transform: `scale(${duoScale})`,
              textShadow: `0 0 ${50 + hitEnv(f, DROP, 10) * 120}px rgba(255,255,255,${0.35 + hitEnv(f, DROP, 10) * 0.5})`,
            }}
          >
            iPhone Duo
          </div>
        )}
        <Ring f={f} at={DROP} x={cx} y={cy} />
        <Burst f={f} at={DROP} x={cx} y={cy} colors={[...APPS.map((a) => a.color), '#ffffff']} />

        {/* final lockup */}
        {f >= FINAL && (
          <>
            {vertical ? (
              APPS.map((a, i) => (
                <div
                  key={a.name}
                  style={{
                    ...text,
                    top: cy - 90 + i * 118,
                    fontWeight: 700,
                    fontSize: 96,
                    letterSpacing: '-0.02em',
                    color: a.color,
                    opacity: Math.min(1, lock(i)) * (1 - endFade),
                    transform: `scale(${mix(1.4, 1, lock(i))})`,
                    textShadow: `0 0 40px ${a.color}88`,
                  }}
                >
                  {a.name}
                </div>
              ))
            ) : (
              <div style={{...text, top: cy - 40, display: 'flex', justifyContent: 'center', gap: 70}}>
                {APPS.map((a, i) => (
                  <span
                    key={a.name}
                    style={{
                      fontWeight: 700,
                      fontSize: 104,
                      letterSpacing: '-0.02em',
                      color: a.color,
                      opacity: Math.min(1, lock(i)) * (1 - endFade),
                      transform: `scale(${mix(1.4, 1, lock(i))})`,
                      display: 'inline-block',
                      textShadow: `0 0 40px ${a.color}88`,
                    }}
                  >
                    {a.name}
                  </span>
                ))}
              </div>
            )}
            <div
              style={{
                ...text,
                top: vertical ? cy + 300 : cy + 130,
                fontWeight: 700,
                fontSize: small,
                letterSpacing: '0.35em',
                color: 'rgba(255,255,255,.85)',
                opacity: nowP * (1 - endFade),
                transform: `translateY(${(1 - nowP) * 20}px)`,
              }}
            >
              NOW COMPATIBLE
            </div>
          </>
        )}
        <Ring f={f} at={FINAL} x={cx} y={cy} />
      </AbsoluteFill>

      {/* flash, vignette, grain */}
      <AbsoluteFill style={{background: '#fff', mixBlendMode: 'overlay', opacity: flash}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle, transparent 55%, rgba(0,0,0,.6) 100%)'}} />
      <Grain f={f} w={width} h={height} />
    </AbsoluteFill>
  );
};
