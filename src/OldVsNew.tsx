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

export const OLD_VS_NEW_DURATION = 870; // 29s @ 30fps
const FPS = 30;
const FONT = "'DM Sans', sans-serif";
const PLUM = '#a1656d';
const PLUM_LIGHT = '#e3b3b9';

const OLD = staticFile('old.jpg');
const NEW = staticFile('new.jpg');

// Section starts, on the 120 BPM grid of scripts/make_music_compare.py (every 4s)
const T = {intro: 0, pair: 120, diff: 240, final: 720};
const SECTION = 120;

type Box = [number, number, number, number]; // x1, y1, x2, y2 in 1080px image space
const FULL: Box = [0, 0, 1080, 1080];

const DIFFS: {title: string; old: string; neu: string; oldBox: Box; newBox: Box; swatch?: boolean}[] = [
  {title: 'BACKGROUND', old: 'Pure black', neu: 'Colour of the product', oldBox: FULL, newBox: FULL, swatch: true},
  {title: 'TITLE', old: 'Loud, all caps, 4 lines', neu: 'Light, one line', oldBox: [40, 30, 1070, 495], newBox: [220, 80, 860, 200]},
  {title: 'PRODUCT', old: 'Hidden behind the text', neu: 'Framed in a tile', oldBox: [290, 340, 800, 1080], newBox: [245, 245, 835, 835]},
  {title: 'BRANDING', old: 'Dark pill', neu: 'Clean italic', oldBox: [390, 925, 695, 1050], newBox: [380, 955, 700, 1040]},
];

// ---------- helpers ----------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);
const tw = (f: number, a: number, b: number, e = inOut) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});
const sp = (f: number, delay = 0, damping = 15, stiffness = 110) =>
  spring({frame: f - delay, fps: FPS, config: {damping, stiffness, mass: 1}});
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const hitEnv = (f: number, at: number, decay = 6) => (f < at ? 0 : Math.exp(-(f - at) / decay));
const lerpBox = (a: Box, b: Box, p: number): Box => [0, 1, 2, 3].map((i) => mix(a[i], b[i], p)) as Box;

// ---------- pieces ----------
const Card: React.FC<{
  src: string;
  cx: number;
  cy: number;
  size: number;
  opacity?: number;
  rotY?: number;
  box?: Box;
  spot?: number; // 0..1 spotlight strength
  glow?: number;
}> = ({src, cx, cy, size, opacity = 1, rotY = 0, box, spot = 0, glow = 0}) => {
  const k = size / 1080;
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - size / 2,
        top: cy - size / 2,
        width: size,
        height: size,
        opacity,
        borderRadius: size * 0.045,
        overflow: 'hidden',
        transform: `perspective(1600px) rotateY(${rotY}deg)`,
        boxShadow: `0 30px 80px rgba(0,0,0,.55), 0 0 ${120 * glow}px ${10 * glow}px rgba(201,143,150,${0.6 * glow}), 0 0 0 1px rgba(255,255,255,.08)`,
      }}
    >
      <Img src={src} style={{width: '100%', height: '100%'}} />
      {box && spot > 0 && (
        <div
          style={{
            position: 'absolute',
            left: box[0] * k,
            top: box[1] * k,
            width: (box[2] - box[0]) * k,
            height: (box[3] - box[1]) * k,
            borderRadius: 14,
            border: `4px solid rgba(255,255,255,${spot})`,
            boxShadow: `0 0 0 3000px rgba(0,0,0,${0.62 * spot}), 0 0 30px rgba(255,255,255,${0.35 * spot})`,
          }}
        />
      )}
    </div>
  );
};

const Pill: React.FC<{text: string; x: number; y: number; p: number; bg: string}> = ({text, x, y, p, bg}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, 0) translateY(${(1 - p) * 20}px) scale(${0.8 + 0.2 * p})`,
      opacity: p,
      padding: '10px 28px',
      borderRadius: 999,
      background: bg,
      color: '#fff',
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: 30,
      letterSpacing: 6,
      boxShadow: '0 10px 30px rgba(0,0,0,.35)',
    }}
  >
    {text}
  </div>
);

/** Text that swaps in (from below) and out (to the top) */
const Swap: React.FC<{p: number; o: number; style: React.CSSProperties; children: React.ReactNode}> = ({
  p,
  o,
  style,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      opacity: p * (1 - o),
      transform: `translateY(${(1 - p) * 40 - o * 40}px)`,
      filter: `blur(${(1 - p) * 8 + o * 8}px)`,
      ...style,
    }}
  >
    {children}
  </div>
);

const Grain: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{opacity: 0.06, mixBlendMode: 'overlay'}}>
    <svg width="1080" height="1080">
      <filter id="g2">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 12} />
      </filter>
      <rect width="100%" height="100%" filter="url(#g2)" />
    </svg>
  </AbsoluteFill>
);

// ---------- composition ----------
export const OldVsNew: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);

  const hits = [T.pair, 240, 360, 480, 600, T.final];
  const punch = Math.max(...hits.map((h) => hitEnv(f, h, 7))) * 0.018 + hitEnv(f, T.final, 10) * 0.02;

  // ---- intro: split screen OLD | vs | NEW ----
  const introIn = sp(f, 0, 18, 90);
  const introOut = tw(f, 108, 124, Easing.bezier(0.7, 0, 0.84, 0));
  const wordOld = sp(f, 8, 12, 120);
  const wordNew = sp(f, 16, 12, 120);
  const vs = sp(f, 30, 10, 160);

  // ---- cards ----
  const oldIn = sp(f, T.pair, 16, 120);
  const newIn = sp(f, T.pair + 6, 16, 120);
  const fin = sp(f, T.final, 20, 80);
  const oldCx = mix(-300, 285, oldIn) - fin * 700;
  const newCx = mix(1380, 795, newIn) + fin * (540 - 795);
  const newSize = mix(450, 660, fin);
  const newCy = mix(540, 505, fin) + Math.sin((f - T.final) / 20) * 6 * fin;

  // ---- which difference is on screen ----
  const inDiff = f >= T.diff && f < T.final;
  const s = Math.min(3, Math.max(0, Math.floor((f - T.diff) / SECTION)));
  const local = f - T.diff - s * SECTION;
  const moveP = tw(local, 0, 20);
  const oldBox = lerpBox(s === 0 ? FULL : DIFFS[s - 1].oldBox, DIFFS[s].oldBox, moveP);
  const newBox = lerpBox(s === 0 ? FULL : DIFFS[s - 1].newBox, DIFFS[s].newBox, moveP);
  const spot = tw(f, T.diff + 4, T.diff + 18) * (1 - tw(f, T.final - 12, T.final)) * (DIFFS[s].swatch ? 0.5 : 1);
  const txtIn = tw(local, 2, 16, out);
  const txtOut = tw(local, SECTION - 10, SECTION);
  const d = DIFFS[s];

  // ---- labels ----
  const pairLabels = tw(f, T.pair + 14, T.pair + 26) * (1 - tw(f, T.final - 10, T.final));
  const whatIn = tw(f, T.pair + 10, T.pair + 26, out);
  const whatOut = tw(f, T.diff - 10, T.diff);
  const arrow = tw(f, T.pair + 24, T.pair + 40, out) * (1 - tw(f, T.final - 10, T.final));

  // ---- final ----
  const finTitle = tw(f, T.final + 8, T.final + 24, out);
  const finSub = tw(f, T.final + 26, T.final + 44, out);
  const fadeOut = tw(f, 848, 870);

  const warm = tw(f, T.final, T.final + 40);
  const bgInner = interpolateColors(warm, [0, 1], ['#1c1920', '#6b3f46']);
  const bgOuter = interpolateColors(warm, [0, 1], ['#060507', '#2a1519']);

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('music-compare.wav')} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${bgInner} 0%, ${bgOuter} 75%)`,
          transform: `scale(${1 + punch})`,
        }}
      >
        {/* ---------- header ---------- */}
        <Swap p={whatIn} o={whatOut} style={{top: 110, width: '100%', textAlign: 'center'}}>
          <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 76, color: '#fff', letterSpacing: -1.5}}>
            What changed?
          </div>
        </Swap>

        {inDiff && (
          <Swap p={txtIn} o={s === 3 ? tw(f, T.final - 10, T.final) : txtOut} style={{top: 70, width: '100%', textAlign: 'center'}}>
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 28, color: PLUM_LIGHT, letterSpacing: 8}}>
              {String(s + 1).padStart(2, '0')} / 04
            </div>
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 92, color: '#fff', letterSpacing: 2, marginTop: 4}}>
              {d.title}
            </div>
          </Swap>
        )}

        {/* ---------- cards ---------- */}
        {f >= T.pair && f < T.final + 30 && (
          <Card src={OLD} cx={oldCx} cy={540} size={450} rotY={(1 - oldIn) * 35} opacity={Math.min(1, oldIn * 2)} box={oldBox} spot={inDiff ? spot : 0} />
        )}
        {f >= T.pair && (
          <Card
            src={NEW}
            cx={newCx}
            cy={newCy}
            size={newSize}
            rotY={(1 - newIn) * -35}
            opacity={Math.min(1, newIn * 2) * (1 - fadeOut)}
            box={newBox}
            spot={inDiff ? spot : 0}
            glow={(inDiff && d.swatch ? txtIn * (1 - txtOut) * 0.8 : 0) + fin * 0.7 + hitEnv(f, T.final, 10)}
          />
        )}

        {/* labels above the cards */}
        <Pill text="OLD" x={285} y={262} p={pairLabels} bg="#2b2830" />
        <Pill text="NEW" x={795} y={262} p={pairLabels} bg={PLUM} />

        {/* arrow */}
        <div
          style={{
            position: 'absolute',
            left: 540 - 30,
            top: 540 - 40,
            width: 60,
            textAlign: 'center',
            fontFamily: FONT,
            fontSize: 64,
            lineHeight: '80px',
            color: '#fff',
            opacity: arrow,
            transform: `translateX(${(1 - arrow) * -30 + Math.sin(f / 8) * 4 * arrow}px)`,
          }}
        >
          →
        </div>

        {/* values under the cards */}
        {inDiff && (
          <>
            <Swap p={txtIn} o={s === 3 ? tw(f, T.final - 10, T.final) : txtOut} style={{top: 800, left: 55, width: 460, textAlign: 'center'}}>
              <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 44, color: 'rgba(255,255,255,.62)', lineHeight: 1.15}}>
                {d.swatch && <Swatch color="#000" />}
                {d.old}
              </div>
            </Swap>
            <Swap p={tw(local, 8, 22, out)} o={s === 3 ? tw(f, T.final - 10, T.final) : txtOut} style={{top: 800, left: 565, width: 460, textAlign: 'center'}}>
              <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 44, color: '#fff', lineHeight: 1.15}}>
                {d.swatch && <Swatch color={PLUM} />}
                {d.neu}
              </div>
            </Swap>
          </>
        )}

        {/* progress dots */}
        {f >= T.diff - 10 && (
          <div
            style={{
              position: 'absolute',
              top: 990,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: 14,
              opacity: tw(f, T.diff - 10, T.diff) * (1 - tw(f, T.final - 10, T.final)),
            }}
          >
            {DIFFS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === s ? 44 : 12,
                  height: 12,
                  borderRadius: 6,
                  background: i === s ? PLUM_LIGHT : 'rgba(255,255,255,.3)',
                }}
              />
            ))}
          </div>
        )}

        {/* ---------- final ---------- */}
        {f >= T.final && (
          <>
            <Swap p={finTitle} o={fadeOut} style={{top: 40, width: '100%', textAlign: 'center'}}>
              <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 96, color: '#fff', letterSpacing: 18}}>NEW</div>
            </Swap>
            <Swap p={finSub} o={fadeOut} style={{top: 870, width: '100%', textAlign: 'center'}}>
              <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 50, color: '#fff'}}>
                Cleaner <span style={{color: PLUM_LIGHT}}>·</span> Calmer <span style={{color: PLUM_LIGHT}}>·</span> On-brand
              </div>
              <div style={{fontFamily: FONT, fontStyle: 'italic', fontSize: 32, color: 'rgba(255,255,255,.7)', marginTop: 18}}>
                fantexinsta
              </div>
            </Swap>
          </>
        )}
      </AbsoluteFill>

      {/* ---------- intro split screen (on top, wipes away) ---------- */}
      {f < 126 && (
        <AbsoluteFill>
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: 540,
              background: '#000',
              transform: `translateX(${(1 - introIn) * -540 - introOut * 560}px)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 140,
                color: '#fff',
                letterSpacing: 4,
                opacity: wordOld,
                transform: `translateY(${(1 - wordOld) * 80}px)`,
              }}
            >
              OLD
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: 540,
              background: PLUM,
              transform: `translateX(${(1 - introIn) * 540 + introOut * 560}px)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 140,
                color: '#fff',
                letterSpacing: 4,
                opacity: wordNew,
                transform: `translateY(${(1 - wordNew) * -80}px)`,
              }}
            >
              NEW
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 540 - 70,
              top: 540 - 70,
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: '#fff',
              color: '#111',
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 56,
              lineHeight: '140px',
              textAlign: 'center',
              transform: `scale(${vs * (1 - introOut)}) rotate(${(1 - vs) * -120}deg)`,
              boxShadow: '0 20px 60px rgba(0,0,0,.5)',
            }}
          >
            vs
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 70,
              width: '100%',
              textAlign: 'center',
              fontFamily: FONT,
              fontStyle: 'italic',
              fontSize: 36,
              color: '#fff',
              opacity: tw(f, 40, 56) * (1 - introOut),
            }}
          >
            fantexinsta
          </div>
        </AbsoluteFill>
      )}

      {/* flash on hits */}
      <AbsoluteFill
        style={{
          background: '#fff',
          mixBlendMode: 'overlay',
          opacity: Math.max(...hits.map((h) => hitEnv(f, h, 4))) * 0.35,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(circle, transparent 55%, rgba(0,0,0,.5) 100%)'}} />
      <Grain f={f} />
      <AbsoluteFill style={{background: '#000', opacity: fadeOut}} />
    </AbsoluteFill>
  );
};

const Swatch: React.FC<{color: string}> = ({color}) => (
  <span
    style={{
      display: 'inline-block',
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: color,
      border: '2px solid rgba(255,255,255,.6)',
      verticalAlign: '-4px',
      marginRight: 12,
    }}
  />
);
