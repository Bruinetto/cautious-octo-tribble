import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  interpolateColors,
  random,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';

export const DURATION = 540; // 18s @ 30fps
const FPS = 30;
const FONT = "'DM Sans', sans-serif";
const PLUM = '#a1656d';

const OLD = staticFile('old.jpg');
const CANDIDATE = staticFile('candidate.jpg');
const NEW = staticFile('new.jpg');

// Frames where the soundtrack hits (see scripts/make_music.py)
const HIT = {
  boom: 9, // 0.3s
  braam: 120, // 4s   candidate enters
  drop: 240, // 8s   colour lands
  recap: 440, // 14.67s
  final: 480, // 16s
};
const ROLL = [465, 469, 472, 476]; // taiko roll before the final hit
// strong taiko hits after the drop: every second, until the recap
const BEATS = Array.from({length: 7}, (_, i) => HIT.drop + i * 30);

// ---------- motion helpers ----------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);
const tw = (f: number, a: number, b: number, e = inOut) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});
const sp = (f: number, delay = 0, damping = 16, stiffness = 90) =>
  spring({frame: f - delay, fps: FPS, config: {damping, stiffness, mass: 1}});
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
/** decaying 0..1 envelope that fires at `at` */
const hitEnv = (f: number, at: number, decay = 6) => (f < at ? 0 : Math.exp(-(f - at) / decay));
const pulseAt = (f: number, frames: number[], decay = 6) => Math.max(0, ...frames.map((b) => hitEnv(f, b, decay)));

// ---------- building blocks ----------
type CardProps = {
  src: string;
  cx: number;
  cy: number;
  size: number;
  rotY?: number;
  rotZ?: number;
  opacity?: number;
  zoom?: number;
  dim?: number;
  blur?: number;
  sheen?: number; // 0..1 progress of a light sweep
  glow?: number;
  reveal?: {src: string; r: number};
};

const Card: React.FC<CardProps> = ({
  src,
  cx,
  cy,
  size,
  rotY = 0,
  rotZ = 0,
  opacity = 1,
  zoom = 1,
  dim = 0,
  blur = 0,
  sheen = -1,
  glow = 0,
  reveal,
}) => (
  <div
    style={{
      position: 'absolute',
      left: cx - size / 2,
      top: cy - size / 2,
      width: size,
      height: size,
      opacity,
      transform: `perspective(1800px) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
      borderRadius: size * 0.045,
      overflow: 'hidden',
      filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
      boxShadow: `0 ${size * 0.05}px ${size * 0.14}px rgba(0,0,0,.55), 0 0 ${size * 0.25 * glow}px ${
        size * 0.03 * glow
      }px rgba(201,143,150,${0.7 * glow}), 0 0 0 1px rgba(255,255,255,.07)`,
    }}
  >
    <Img src={src} style={{width: '100%', height: '100%', transform: `scale(${zoom})`}} />
    {reveal && reveal.r > 0 && (
      <Img
        src={reveal.src}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          transform: `scale(${zoom})`,
          clipPath: `circle(${reveal.r * 75}% at 50% 50%)`,
        }}
      />
    )}
    {sheen > 0 && sheen < 1 && (
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          height: '200%',
          width: '35%',
          left: `${mix(-60, 130, sheen)}%`,
          transform: 'rotate(20deg)',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent)',
        }}
      />
    )}
    {dim > 0 && <AbsoluteFill style={{background: `rgba(10,8,12,${dim})`}} />}
  </div>
);

/** Letter-by-letter reveal */
const Label: React.FC<{text: string; x: number; y: number; p: number; size?: number}> = ({
  text,
  x,
  y,
  p,
  size = 26,
}) => {
  const chars = text.split('');
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 300,
        width: 600,
        top: y,
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: size * 0.32,
        color: '#fff',
        whiteSpace: 'pre',
      }}
    >
      {chars.map((c, i) => {
        const q = Math.min(1, Math.max(0, p * (chars.length + 3) - i) / 3);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: q,
              transform: `translateY(${(1 - q) * 14}px)`,
              filter: `blur(${(1 - q) * 6}px)`,
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
};

const Symbol: React.FC<{char: string; x: number; y: number; p: number}> = ({char, x, y, p}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 40,
      top: y - 50,
      width: 80,
      height: 100,
      textAlign: 'center',
      fontFamily: FONT,
      fontWeight: 400,
      fontSize: 84,
      lineHeight: '100px',
      color: '#fff',
      opacity: Math.min(1, p),
      transform: `scale(${0.3 + p * 0.7}) rotate(${(1 - p) * -90}deg)`,
    }}
  >
    {char}
  </div>
);

/** Particle burst */
const Burst: React.FC<{f: number; at: number; x: number; y: number; n?: number; power?: number}> = ({
  f,
  at,
  x,
  y,
  n = 70,
  power = 1,
}) => {
  const t = f - at;
  if (t < 0 || t > 70) return null;
  const colors = [PLUM, '#e3b3b9', '#ffffff', '#c98f96'];
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const a = random(`a${at}-${i}`) * Math.PI * 2;
        const speed = (8 + random(`s${at}-${i}`) * 34) * power;
        const life = 30 + random(`l${at}-${i}`) * 40;
        const size = 3 + random(`z${at}-${i}`) * 9;
        const d = speed * 12 * (1 - Math.exp(-t / 12));
        const px = x + Math.cos(a) * d;
        const py = y + Math.sin(a) * d + 0.05 * t * t;
        const o = Math.max(0, 1 - t / life);
        const c = colors[i % colors.length];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: px - size / 2,
              top: py - size / 2,
              width: size,
              height: size,
              borderRadius: '50%',
              background: c,
              opacity: o,
              boxShadow: `0 0 ${size * 2}px ${c}`,
              transform: `scale(${1 - t / life / 2})`,
            }}
          />
        );
      })}
    </>
  );
};

const Ring: React.FC<{f: number; at: number; x: number; y: number; len?: number; max?: number; width?: number}> = ({
  f,
  at,
  x,
  y,
  len = 36,
  max = 14,
  width = 4,
}) => {
  const p = tw(f, at, at + len, out);
  if (p <= 0 || p >= 1) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 40,
        top: y - 40,
        width: 80,
        height: 80,
        borderRadius: '50%',
        border: `${width}px solid #e3b3b9`,
        boxShadow: `0 0 30px ${PLUM}, inset 0 0 30px ${PLUM}`,
        opacity: 1 - p,
        transform: `scale(${1 + p * max})`,
      }}
    />
  );
};

const Grain: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
    <svg width="1080" height="1080">
      <filter id="g">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 12} />
      </filter>
      <rect width="100%" height="100%" filter="url(#g)" />
    </svg>
  </AbsoluteFill>
);

// ---------- timeline ----------
// 0   – 110  old post (boom at 0.3s)
// 112 – 180  candidate slams in on the braam at 4s, "+"
// 180 – 240  colour drop flies from old → candidate
// 240        DROP: flash, shake, burst, candidate turns into new
// 290 – 440  new post hero, pulsing with the taikos
// 440 – 540  recap: old + candidate = new, final hit at 16s

export const DesignLanguage: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);

  // --- camera: shake + punch-in on every hit ---
  const shake =
    hitEnv(f, HIT.boom, 5) * 6 +
    hitEnv(f, HIT.braam, 5) * 10 +
    hitEnv(f, HIT.drop, 8) * 22 +
    hitEnv(f, HIT.recap, 5) * 8 +
    hitEnv(f, HIT.final, 7) * 16 +
    pulseAt(f, BEATS.slice(1), 4) * 3 +
    pulseAt(f, ROLL, 3) * 4;
  const shakeX = Math.sin(f * 2.7) * shake + Math.sin(f * 5.3) * shake * 0.4;
  const shakeY = Math.cos(f * 3.1) * shake * 0.8;
  const punch =
    hitEnv(f, HIT.braam, 8) * 0.02 + hitEnv(f, HIT.drop, 12) * 0.05 + hitEnv(f, HIT.final, 10) * 0.035;
  const drift = 1 + tw(f, 0, 110, Easing.linear) * 0.025 * (1 - tw(f, 105, 125));
  const camScale = drift + punch;

  // --- stage background: dark → warm plum ---
  const warm = tw(f, 240, 320);
  const recap = tw(f, 440, 480);
  const bgInner = interpolateColors(warm - recap * 0.6, [0, 1], ['#1b1820', '#6b3f46']);
  const bgOuter = interpolateColors(warm - recap * 0.6, [0, 1], ['#050406', '#2a1519']);

  // --- OLD card ---
  const oldIn = sp(f, HIT.boom, 18, 70);
  const toSide = sp(f, 106, 20, 90);
  const oldExit = tw(f, 228, 262);
  const oldCx = mix(540, 290, toSide) - oldExit * 560 - hitEnv(f, HIT.braam, 6) * 30;
  const oldSize = mix(mix(760, 640, oldIn), 420, toSide);
  const oldRot = mix(22 * (1 - oldIn), 10, toSide);

  // --- CANDIDATE card: slams in on the braam ---
  const candIn = sp(f, 110, 13, 140);
  const toCenter = sp(f, 244, 20, 70);
  const candCx = mix(1500, 790, candIn) + toCenter * (540 - 790);
  const candRot = mix(-55, -10, candIn) * (1 - toCenter);
  const reveal = tw(f, HIT.drop, 282, Easing.bezier(0.3, 0, 0.1, 1));

  // --- hero ---
  const hero = sp(f, 285, 22, 60);
  const recapShrink = sp(f, HIT.recap, 20, 90);
  const beat = pulseAt(f, BEATS, 7) * (f < HIT.recap ? 1 : 0);
  const candSize = mix(mix(420, 640, toCenter), 780, hero) * (1 + beat * 0.018);
  const finalPulse = hitEnv(f, HIT.final, 8);
  const heroSize = mix(candSize, 250, recapShrink) * (1 + finalPulse * 0.08 * recapShrink);
  const heroCx = mix(540, 820, recapShrink);
  const float = Math.sin((f - 285) / 22) * 8 * hero * (1 - recapShrink);

  // --- colour drop (old → candidate) ---
  const dropPos = (fr: number) => {
    const t = tw(fr, 188, HIT.drop, Easing.bezier(0.55, 0, 0.35, 1));
    const sx = mix(540, 290, sp(fr, 106, 20, 90)) + 20;
    return {
      x: mix(sx, 790, t),
      y: mix(560, 540, t) - Math.sin(Math.PI * t) * 250,
    };
  };
  const dropBorn = sp(f, 178, 10, 160);
  const dropVisible = f >= 178 && f < HIT.drop;
  const drop = dropPos(f);
  const dropScale = dropBorn * (1 + hitEnv(f, 178, 5) * 0.4);

  // --- flashes ---
  const flash = hitEnv(f, HIT.drop, 5) * 0.85 + hitEnv(f, HIT.final, 5) * 0.45 + hitEnv(f, HIT.boom, 4) * 0.25;

  // --- labels ---
  const oldLbl = tw(f, 36, 60) * (1 - tw(f, 98, 110));
  const pairLbl = tw(f, 140, 165) * (1 - tw(f, 178, 190));
  const plusP = sp(f, 150, 10, 140) * (1 - tw(f, 178, 190));
  const newLbl = tw(f, 320, 350) * (1 - tw(f, 428, 440));

  // --- recap ---
  const r1 = sp(f, HIT.recap, 14, 120);
  const r2 = sp(f, HIT.recap + 8, 14, 120);
  const rSym1 = sp(f, ROLL[0], 10, 160);
  const rSym2 = sp(f, ROLL[2], 10, 160);
  const rLbl = tw(f, 484, 510);
  const inRecap = f >= HIT.recap;
  const outro = tw(f, 522, 540);

  // hero glow behind the new post
  const glowO = (warm * (1 - recapShrink * 0.5)) * (0.45 + beat * 0.4 + finalPulse * 0.6);

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('music.wav')} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 45%, ${bgInner} 0%, ${bgOuter} 75%)`,
          transform: `translate(${shakeX}px, ${shakeY}px) scale(${camScale})`,
        }}
      >
        {/* glow */}
        <div
          style={{
            position: 'absolute',
            left: (inRecap ? heroCx : 540) - 520,
            top: 520 - 520,
            width: 1040,
            height: 1040,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(201,143,150,.55) 0%, rgba(161,101,109,.2) 35%, transparent 65%)`,
            opacity: glowO,
          }}
        />

        {/* OLD */}
        {f < 265 && (
          <Card
            src={OLD}
            cx={oldCx}
            cy={mix(570, 520, toSide)}
            size={oldSize}
            rotY={oldRot}
            opacity={interpolate(f, [HIT.boom - 2, HIT.boom + 8], [0, 1], clamp) * (1 - oldExit)}
            blur={(1 - oldIn) * 18}
            zoom={1.06 - tw(f, 0, 200, Easing.linear) * 0.06}
            dim={tw(f, 185, 238) * 0.4}
            sheen={tw(f, 30, 70)}
          />
        )}
        <Label text="OLD" x={540} y={935} p={oldLbl} />

        {/* CANDIDATE → NEW (pixel aligned, so the reveal is seamless) */}
        {f >= 110 && !inRecap && (
          <Card
            src={CANDIDATE}
            cx={candCx}
            cy={mix(520, 540, toCenter) + float - hero * 10}
            size={candSize}
            rotY={candRot}
            opacity={interpolate(f, [110, 116], [0, 1], clamp)}
            zoom={1 + tw(f, 285, 440, Easing.linear) * 0.03}
            sheen={f < 200 ? tw(f, 128, 165) : tw(f, 300, 345)}
            glow={beat * 0.6 + hitEnv(f, HIT.drop, 10)}
            reveal={{src: NEW, r: reveal}}
          />
        )}

        {/* impact FX */}
        <Ring f={f} at={HIT.drop} x={790} y={540} />
        <Ring f={f} at={HIT.drop + 4} x={790} y={540} len={44} max={20} width={2} />
        <Burst f={f} at={HIT.drop} x={790} y={540} n={80} />

        {/* colour drop + comet trail */}
        {dropVisible &&
          Array.from({length: 9}, (_, k) => {
            const p = dropPos(f - k * 1.5);
            const s = (92 - k * 8) * dropScale;
            return (
              <div
                key={k}
                style={{
                  position: 'absolute',
                  left: p.x - s / 2,
                  top: p.y - s / 2,
                  width: s,
                  height: s,
                  borderRadius: '50%',
                  opacity: k === 0 ? 1 : 0.35 * (1 - k / 9),
                  background:
                    k === 0 ? `radial-gradient(circle at 35% 30%, #e3b3b9, ${PLUM} 55%, #7d4750)` : PLUM,
                  boxShadow: k === 0 ? `0 0 70px 10px ${PLUM}, 0 10px 30px rgba(0,0,0,.4)` : `0 0 30px ${PLUM}`,
                  filter: k === 0 ? undefined : `blur(${k}px)`,
                }}
              />
            );
          }).reverse()}
        {f >= 178 && f < 200 && <Ring f={f} at={178} x={drop.x} y={drop.y} len={18} max={3} width={2} />}

        {/* side-by-side labels & plus */}
        <Label text="OLD" x={290} y={760} p={pairLbl} />
        <Label text="CANDIDATE" x={790} y={760} p={pairLbl} />
        <Symbol char="+" x={540} y={520} p={plusP} />

        <Label text="NEW" x={540} y={975} p={newLbl} size={28} />

        {/* RECAP: old + candidate = new */}
        {inRecap && (
          <>
            <Card src={OLD} cx={mix(-250, 190, r1)} cy={520} size={250} opacity={Math.min(1, r1 * 2)} rotY={(1 - r1) * 40} />
            <Card
              src={CANDIDATE}
              cx={mix(-250, 505, r2)}
              cy={520}
              size={250}
              opacity={Math.min(1, r2 * 2)}
              rotY={(1 - r2) * 40}
            />
            <Card
              src={NEW}
              cx={heroCx}
              cy={520 + float}
              size={heroSize}
              glow={finalPulse * 1.2 + tw(f, 480, 500) * 0.35}
              sheen={tw(f, 482, 515)}
            />
            <Symbol char="+" x={347} y={520} p={rSym1} />
            <Symbol char="=" x={663} y={520} p={rSym2} />
            <Burst f={f} at={HIT.final} x={820} y={520} n={60} power={0.7} />
            <Ring f={f} at={HIT.final} x={820} y={520} len={30} max={8} />
            <Label text="OLD" x={190} y={690} p={rLbl} size={20} />
            <Label text="CANDIDATE" x={505} y={690} p={rLbl} size={20} />
            <Label text="NEW" x={820} y={690} p={rLbl} size={20} />
          </>
        )}
      </AbsoluteFill>

      {/* flash */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${f > 400 ? 76 : 73}% 50%, #fff 0%, #e3b3b9 40%, ${PLUM} 100%)`,
          opacity: flash,
          mixBlendMode: 'screen',
        }}
      />
      {/* vignette + grain */}
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)'}} />
      <Grain f={f} />
      <AbsoluteFill style={{background: '#000', opacity: outro}} />
    </AbsoluteFill>
  );
};
