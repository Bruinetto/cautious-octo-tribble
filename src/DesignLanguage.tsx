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

// ---------- motion helpers ----------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);
const tw = (f: number, a: number, b: number, e = inOut) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});
const sp = (f: number, delay = 0, damping = 16, stiffness = 90) =>
  spring({frame: f - delay, fps: FPS, config: {damping, stiffness, mass: 1}});
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

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
  reveal?: {src: string; r: number; x?: number; y?: number};
  radius?: number;
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
  reveal,
  radius = 0.045,
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
      borderRadius: size * radius,
      overflow: 'hidden',
      boxShadow: `0 ${size * 0.05}px ${size * 0.14}px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.06)`,
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
          clipPath: `circle(${reveal.r * 75}% at ${reveal.x ?? 50}% ${reveal.y ?? 50}%)`,
        }}
      />
    )}
    {dim > 0 && <AbsoluteFill style={{background: `rgba(10,8,12,${dim})`}} />}
  </div>
);

const Label: React.FC<{
  text: string;
  x: number;
  y: number;
  p: number;
  size?: number;
  sub?: string;
  color?: string;
}> = ({text, x, y, p, size = 26, sub, color = '#fff'}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 300,
      width: 600,
      top: y,
      textAlign: 'center',
      fontFamily: FONT,
      color,
      opacity: p,
      transform: `translateY(${(1 - p) * 18}px)`,
    }}
  >
    <div style={{fontWeight: 700, fontSize: size, letterSpacing: size * 0.32}}>{text}</div>
    {sub && (
      <div style={{fontWeight: 400, fontSize: size * 0.72, opacity: 0.6, marginTop: 8, letterSpacing: 0.5}}>
        {sub}
      </div>
    )}
  </div>
);

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
      opacity: p,
      transform: `scale(${0.3 + p * 0.7}) rotate(${(1 - p) * -90}deg)`,
    }}
  >
    {char}
  </div>
);

// ---------- timeline ----------
// 0   – 105  old post solo
// 105 – 175  candidate joins, side by side, "+"
// 175 – 250  colour drop from old → candidate
// 250 – 310  candidate turns into new (circular reveal)
// 310 – 440  new post hero
// 440 – 540  recap: old + candidate = new

export const DesignLanguage: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);

  // --- stage background: dark → warm plum ---
  const warm = tw(f, 250, 340);
  const recap = tw(f, 440, 480);
  const bgInner = interpolateColors(warm - recap * 0.7, [0, 1], ['#1b1820', '#6b3f46']);
  const bgOuter = interpolateColors(warm - recap * 0.7, [0, 1], ['#070608', '#2a1519']);

  // --- OLD card ---
  const oldIn = sp(f, 10, 18, 70);
  const toSide = sp(f, 105, 20, 80); // move to the left
  const oldExit = tw(f, 225, 262); // leaves after giving its colour
  const oldCx = mix(540, 290, toSide) - oldExit * 520;
  const oldSize = mix(mix(560, 640, oldIn), 420, toSide);
  const oldRot = mix(28 * (1 - oldIn), 10, toSide);

  // --- CANDIDATE card ---
  const candIn = sp(f, 118, 18, 80);
  const toCenter = sp(f, 245, 20, 70);
  const candCx = mix(1400, 790, candIn) + toCenter * (540 - 790);
  const candRot = mix(-40, -10, candIn) * (1 - toCenter);
  const reveal = tw(f, 238, 290, Easing.bezier(0.5, 0, 0.1, 1));

  // --- hero growth ---
  const hero = sp(f, 290, 22, 60);
  const recapShrink = sp(f, 440, 22, 80);
  const candSize = mix(mix(420, 640, toCenter), 800, hero);
  const heroSize = mix(candSize, 250, recapShrink);
  const heroCx = mix(540, 820, recapShrink);
  const float = Math.sin((f - 290) / 22) * 8 * hero * (1 - recapShrink);

  // --- colour drop (old → candidate) ---
  const dropT = tw(f, 186, 240, Easing.bezier(0.45, 0, 0.2, 1));
  const dropBorn = sp(f, 176, 12, 140);
  const dropStart = {x: oldCx + 20, y: 560};
  const dropEnd = {x: 790, y: 540};
  const dropX = mix(dropStart.x, dropEnd.x, dropT);
  const dropY = mix(dropStart.y, dropEnd.y, dropT) - Math.sin(Math.PI * dropT) * 230;
  const dropScale = dropBorn * (1 - tw(f, 234, 244));
  const dropVisible = f >= 176 && f < 246;
  const ripple = tw(f, 238, 275, out);

  // --- labels ---
  const oldLbl = tw(f, 40, 58) * (1 - tw(f, 100, 110));
  const pairLbl = tw(f, 145, 162) * (1 - tw(f, 178, 190));
  const plusP = sp(f, 150, 14, 120) * (1 - tw(f, 178, 190));
  const newLbl = tw(f, 330, 350) * (1 - tw(f, 430, 442));

  // --- recap ---
  const r1 = sp(f, 452, 18, 90);
  const r2 = sp(f, 460, 18, 90);
  const rSym1 = sp(f, 470, 14, 120);
  const rSym2 = sp(f, 478, 14, 120);
  const rLbl = tw(f, 486, 504);
  const inRecap = f >= 440;

  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, ${bgInner} 0%, ${bgOuter} 75%)`}}>
      <Audio src={staticFile('music.wav')} />
      {/* OLD */}
      {f < 265 && (
        <Card
          src={OLD}
          cx={oldCx}
          cy={mix(570, 520, toSide)}
          size={oldSize}
          rotY={oldRot}
          opacity={interpolate(f, [10, 26], [0, 1], clamp) * (1 - oldExit)}
          zoom={1.06 - tw(f, 0, 200, Easing.linear) * 0.06}
          dim={tw(f, 190, 240) * 0.35}
        />
      )}
      <Label text="OLD" x={540} y={935} p={oldLbl} />

      {/* CANDIDATE → NEW (pixel aligned, so the reveal is seamless) */}
      {f >= 118 && !inRecap && (
        <Card
          src={CANDIDATE}
          cx={candCx}
          cy={mix(520, 540, toCenter) + float - hero * 10}
          size={candSize}
          rotY={candRot}
          opacity={interpolate(f, [118, 132], [0, 1], clamp)}
          zoom={1 + tw(f, 290, 440, Easing.linear) * 0.03}
          reveal={{src: NEW, r: reveal, x: 50, y: 50}}
        />
      )}

      {/* ripple where the colour lands */}
      {ripple > 0 && ripple < 1 && (
        <div
          style={{
            position: 'absolute',
            left: candCx - 30,
            top: 540 - 30,
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: `3px solid ${PLUM}`,
            opacity: 1 - ripple,
            transform: `scale(${1 + ripple * 9})`,
          }}
        />
      )}

      {/* colour drop */}
      {dropVisible && (
        <div
          style={{
            position: 'absolute',
            left: dropX - 46,
            top: dropY - 46,
            width: 92,
            height: 92,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, #c98f96, ${PLUM} 55%, #7d4750)`,
            boxShadow: `0 0 60px ${PLUM}, 0 10px 30px rgba(0,0,0,.4)`,
            transform: `scale(${dropScale})`,
          }}
        />
      )}

      {/* side-by-side labels & plus */}
      <Label text="OLD" x={290} y={760} p={pairLbl} />
      <Label text="CANDIDATE" x={790} y={760} p={pairLbl} />
      <Symbol char="+" x={540} y={520} p={plusP} />

      <Label text="NEW" x={540} y={985} p={newLbl} size={26} />

      {/* RECAP: old + candidate = new */}
      {inRecap && (
        <>
          <Card src={OLD} cx={mix(-200, 190, r1)} cy={520} size={250} opacity={r1} />
          <Card src={CANDIDATE} cx={mix(-200, 505, r2)} cy={520} size={250} opacity={r2} />
          <Card src={NEW} cx={heroCx} cy={520 + float} size={heroSize} zoom={1} />
          <Symbol char="+" x={347} y={520} p={rSym1} />
          <Symbol char="=" x={663} y={520} p={rSym2} />
          <Label text="OLD" x={190} y={690} p={rLbl} size={20} />
          <Label text="CANDIDATE" x={505} y={690} p={rLbl} size={20} />
          <Label text="NEW" x={820} y={690} p={rLbl} size={20} />
        </>
      )}
    </AbsoluteFill>
  );
};
