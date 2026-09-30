import React from 'react';
import {AbsoluteFill, interpolate, Easing, useCurrentFrame} from 'remotion';
import {CandidatePost, NewPost, OldPost} from './posts';

// timeline (frames @30fps)
const A = 0; // old
const B = 105; // candidate
const C = 215; // formula
const D = 360; // new, hold
export const DURATION = 480;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const t = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: ease});

const Chip: React.FC<{text: string; f: number; dark?: boolean; color?: string}> = ({text, f, dark, color}) => {
  const p = t(f, 0, 14);
  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        left: 40,
        padding: '12px 26px',
        borderRadius: 999,
        fontFamily: 'sans-serif',
        fontWeight: 700,
        letterSpacing: 4,
        fontSize: 24,
        background: color ?? (dark ? '#fff' : '#111'),
        color: dark ? '#111' : '#fff',
        opacity: p,
        transform: `translateY(${(1 - p) * -16}px)`,
      }}
    >
      {text}
    </div>
  );
};

const Card: React.FC<{
  children: React.ReactNode;
  x: number;
  y?: number;
  scale: number;
  opacity?: number;
  radiusT?: number;
  label?: string;
  labelOpacity?: number;
}> = ({children, x, y = 500, scale, opacity = 1, radiusT = 0, label, labelOpacity = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 540,
      top: y - 540,
      width: 1080,
      height: 1080,
      transform: `scale(${scale})`,
      opacity,
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 48 * (1 - radiusT),
        overflow: 'hidden',
        boxShadow: '0 40px 120px rgba(0,0,0,.55)',
      }}
    >
      {children}
    </div>
    {label && (
      <div
        style={{
          position: 'absolute',
          top: 1120,
          width: '100%',
          textAlign: 'center',
          color: '#fff',
          fontFamily: 'sans-serif',
          fontWeight: 700,
          letterSpacing: 10,
          fontSize: 64,
          opacity: labelOpacity,
        }}
      >
        {label}
      </div>
    )}
  </div>
);

const Formula: React.FC<{f: number}> = ({f}) => {
  const enter = t(f, 0, 26);
  const plus = t(f, 30, 44);
  const merge = t(f, 62, 92);
  const newIn = t(f, 76, 98);
  const full = t(f, 104, 138);

  const sepX = 235 * (1 - merge);
  const cardScale = 0.36 + merge * 0.1;
  const slide = (1 - enter) * 700;

  return (
    <AbsoluteFill style={{background: '#14111a'}}>
      {/* soft glow */}
      <AbsoluteFill
        style={{background: `radial-gradient(circle at 50% 46%, rgba(161,101,109,${0.15 + newIn * 0.35}) 0%, transparent 60%)`}}
      />
      <Card
        x={540 - sepX - slide}
        scale={cardScale}
        opacity={(1 - newIn) * enter}
        label="OLD"
        labelOpacity={1 - merge}
      >
        <OldPost f={200} />
      </Card>
      <Card
        x={540 + sepX + slide}
        scale={cardScale}
        opacity={(1 - newIn) * enter}
        label="CANDIDATE"
        labelOpacity={1 - merge}
      >
        <CandidatePost f={200} />
      </Card>
      {/* + sign */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: '100%',
          top: 380,
          textAlign: 'center',
          color: '#fff',
          fontFamily: 'sans-serif',
          fontWeight: 300,
          fontSize: 150,
          opacity: plus * (1 - merge),
          transform: `scale(${0.4 + plus * 0.6}) rotate(${(1 - plus) * 90}deg)`,
        }}
      >
        +
      </div>
      {/* result card grows to full frame */}
      <Card
        x={540}
        y={500 + full * 40}
        scale={(0.5 + newIn * 0.03) * (1 - full) + full * 1}
        opacity={newIn}
        radiusT={full}
        label="NEW"
        labelOpacity={1 - full}
      >
        <NewPost f={Math.max(0, f - 76)} />
      </Card>
    </AbsoluteFill>
  );
};

export const DesignLanguage: React.FC = () => {
  const frame = useCurrentFrame();

  // A -> B circle wipe
  const wipe1 = t(frame, B - 14, B + 10);
  // C -> D handled inside Formula (full-frame new card)
  const inC = frame >= C && frame < D;

  return (
    <AbsoluteFill style={{background: '#000'}}>
      {frame < C && (
        <>
          <AbsoluteFill>
            <OldPost f={frame - A} />
            <Chip text="OLD" f={frame} dark />
          </AbsoluteFill>
          {frame > B - 14 && (
            <AbsoluteFill style={{clipPath: `circle(${wipe1 * 110}% at 50% 50%)`}}>
              <CandidatePost f={frame - B} />
              <Chip text="CANDIDATE" f={frame - B} />
            </AbsoluteFill>
          )}
        </>
      )}
      {inC && <Formula f={frame - C} />}
      {frame >= D && (
        <AbsoluteFill>
          <NewPost f={frame - D + 69} />
          <Chip text="NEW DESIGN LANGUAGE" f={frame - D - 6} dark color="rgba(255,255,255,.92)" />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
