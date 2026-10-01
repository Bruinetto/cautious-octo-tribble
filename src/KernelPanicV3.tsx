import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';

// 36s @ 30fps, 1080x1920. Frame numbers are hits in scripts/make_music_kp_v3.py.
// 0-10s: Apple-like minimal explanation. 10s on: clean, epic typography (no glitch/flare effects).
export const KP_V3_DURATION = 1080;
const FPS = 30;
const FONT = "'DM Sans', sans-serif";
const MONO = "'DejaVu Sans Mono', 'Liberation Mono', monospace";
const C = {
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

const T = {
  // minimal intro
  hasKernel: 6,
  stack: 75,
  chips: 150,
  error: 225,
  out: 282,
  // epic
  panic: 300,
  stop: 360,
  restart: 390,
  causes: [420, 480, 540, 600],
  spot: 660,
  parts: [690, 720, 750],
  fix: [780, 810, 840, 870, 900, 930],
  final: 960,
  end: 1080,
};
const HITS: [number, number][] = [
  [T.panic, 1],
  [T.stop, 0.6],
  [T.restart, 0.6],
  ...T.causes.map((h): [number, number] => [h, 0.7]),
  [T.spot, 0.5],
  ...T.parts.map((h): [number, number] => [h, 0.35]),
  ...T.fix.map((h): [number, number] => [h, 0.45]),
  [T.final, 1],
];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const tw = (f: number, a: number, b: number, e = ease) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});
const sp = (f: number, at: number, damping = 20, stiffness = 120) =>
  spring({frame: f - at, fps: FPS, config: {damping, stiffness, mass: 1}});
const hitEnv = (f: number, at: number, decay = 7) => (f < at ? 0 : Math.exp(-(f - at) / decay));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

// ---------- minimal pieces ----------
/** Apple-style headline: soft fade + rise */
const Headline: React.FC<{f: number; at: number; until: number; y: number; children: React.ReactNode; size?: number; color?: string}> = ({
  f,
  at,
  until,
  y,
  children,
  size = 66,
  color = C.text,
}) => {
  if (f < at || f > until + 12) return null;
  const p = tw(f, at, at + 18);
  const o = tw(f, until, until + 10);
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        right: 90,
        top: y,
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.15,
        letterSpacing: '-0.02em',
        color,
        opacity: p * (1 - o),
        transform: `translateY(${(1 - p) * 24 - o * 12}px)`,
      }}
    >
      {children}
    </div>
  );
};

const Box: React.FC<{p: number; y: number; label: string; accent?: string; glow?: number}> = ({p, y, label, accent, glow = 0}) => (
  <div
    style={{
      position: 'absolute',
      left: 180,
      width: 720,
      top: y,
      height: 132,
      borderRadius: 34,
      background: accent ? `color-mix(in srgb, ${accent} 14%, ${C.box})` : C.box,
      border: `2px solid ${accent ?? C.line}`,
      boxShadow: accent ? `0 0 ${40 + glow * 40}px color-mix(in srgb, ${accent} ${30 + glow * 30}%, transparent)` : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: 48,
      color: accent ? C.text : C.grey,
      opacity: Math.min(1, p),
      transform: `translateY(${(1 - p) * 40}px) scale(${0.96 + 0.04 * p})`,
    }}
  >
    {label}
  </div>
);

const Pill: React.FC<{p: number; children: React.ReactNode; color?: string; size?: number}> = ({p, children, color, size = 38}) => (
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

// ---------- epic (clean) pieces ----------
/** Big clean slam: springs in from a larger scale, scales through on exit. No glitch, no flares. */
const Slam: React.FC<{f: number; at: number; until?: number; y: number; size: number; color?: string; weight?: number; font?: string; spacing?: string; children: React.ReactNode}> = ({
  f,
  at,
  until,
  y,
  size,
  color = C.text,
  weight = 700,
  font = FONT,
  spacing = '-0.035em',
  children,
}) => {
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

const Label: React.FC<{f: number; at: number; until: number; y: number; children: React.ReactNode; color?: string}> = ({f, at, until, y, children, color = C.grey}) => {
  if (f < at || f > until + 10) return null;
  const p = tw(f, at, at + 12);
  const o = tw(f, until, until + 8);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 38, letterSpacing: '0.28em', color, opacity: p * (1 - o), transform: `translateY(${(1 - p) * 16}px)`}}>
      {children}
    </div>
  );
};

/** The big "Kernel panic." moment: staggered letters, clean shockwaves and a red burst. */
const PanicTitle: React.FC<{f: number; at: number; until?: number}> = ({f, at, until}) => {
  const t = f - at;
  if (t < -2 || (until !== undefined && f > until + 8)) return null;
  const exit = until !== undefined ? tw(f, until, until + 8, Easing.in(Easing.cubic)) : 0;
  const letters = (word: string, y: number, size: number, color: string, delay: number, fromTop: boolean) => (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', transform: 'translateY(-50%)'}}>
      {word.split('').map((ch, i) => {
        const s = spring({frame: t - delay - i * 1.6, fps: FPS, config: {damping: 11, stiffness: 240, mass: 0.7}});
        const on = t - delay - i * 1.6 >= 0;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: size,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              color,
              opacity: on ? Math.min(1, s * 2) * (1 - exit) : 0,
              transform: fromTop
                ? `translateY(${(1 - s) * -260}px) scale(${1 + exit * 0.35})`
                : `scale(${mix(2.8, 1, s) * (1 + exit * 0.35)})`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
  const ring = (delay: number, color: string, width: number) => {
    const p = tw(f, at + delay, at + delay + 32, Easing.out(Easing.cubic));
    if (p <= 0 || p >= 1) return null;
    const r = 60 + p * 1100;
    return <div style={{position: 'absolute', left: 540 - r, top: 960 - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `${width * (1 - p) + 1}px solid ${color}`, opacity: 1 - p}} />;
  };
  const burst = hitEnv(f, at + 4, 14);
  return (
    <>
      <div style={{position: 'absolute', left: 540 - 900, top: 960 - 900, width: 1800, height: 1800, borderRadius: '50%', background: `radial-gradient(circle, color-mix(in srgb, ${C.red} 55%, transparent) 0%, transparent 60%)`, opacity: burst * (1 - exit), transform: `scale(${0.4 + (1 - burst) * 0.8})`}} />
      {ring(4, C.red, 14)}
      {ring(9, '#ffffff', 6)}
      {letters('Kernel', 860, 190, C.text, 0, true)}
      {letters('panic.', 1050, 220, C.red, 4, false)}
    </>
  );
};

const CAUSES = [
  {n: '01', title: 'Software\nbugs', sub: 'In iOS or an app', color: C.red},
  {n: '02', title: 'Faulty\nhardware', sub: 'Battery, cables, sensors', color: C.orange},
  {n: '03', title: 'Non-genuine\nparts', sub: 'After a repair', color: C.yellow},
  {n: '04', title: 'Jailbreak\ntweaks', sub: 'A modified system', color: C.purple},
];

const FILE_PARTS = [
  {text: 'panic-full', color: C.red, label: 'Kernel panic log'},
  {text: '-2026-10-01-104512', color: C.text, label: 'When it happened'},
  {text: '.ips', color: C.blue, label: 'Crash report file'},
];

// ---------- composition ----------
export const KernelPanicV3: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);

  // camera: gentle punch on hits, a small shake only on the two biggest
  const punch = HITS.reduce((a, [h, s]) => a + hitEnv(f, h, 9) * s * 0.035, 0);
  const shake = hitEnv(f, T.panic, 7) * 20 + hitEnv(f, T.final, 7) * 18 + hitEnv(f, T.panic + 4, 5) * 10;
  const impactZoom = (f >= T.panic ? 0.14 * hitEnv(f, T.panic, 10) : 0) + (f >= T.final ? 0.12 * hitEnv(f, T.final, 10) : 0);
  const flash = Math.max(hitEnv(f, T.panic, 4), hitEnv(f, T.final, 4)) * 0.45;
  const sx = Math.sin(f * 2.7) * shake;
  const sy = Math.cos(f * 3.1) * shake * 0.8;

  // intro fades out into a beat of black before the drop
  const introOut = tw(f, T.out, T.panic - 4);
  const intro = f < T.panic;

  // background tint for the epic part
  const tint =
    f < T.panic ? 'transparent' : f < T.causes[0] ? C.red : f < T.spot ? CAUSES[Math.min(3, Math.floor((f - T.causes[0]) / 60))].color : f < T.fix[0] ? C.blue : f < T.fix[3] ? C.green : f < T.final ? C.red : C.blue;

  const kernelRed = tw(f, T.error + 20, T.error + 40);
  const stackP = (i: number) => sp(f, T.stack + i * 6);

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden', fontFamily: FONT}}>
      <Audio src={staticFile('kp/music-v3.wav')} />
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${1 + punch + impactZoom})`}}>
        {!intro && <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 45% at 50% 50%, color-mix(in srgb, ${tint} 22%, transparent), transparent 70%)`}} />}

        {/* ---------- 0-10s: minimal explanation ---------- */}
        {intro && (
          <AbsoluteFill style={{opacity: 1 - introOut, transform: `scale(${1 - introOut * 0.04})`}}>
            <Headline f={f} at={T.hasKernel} until={T.stack - 8} y={860} size={84}>
              Every iPhone
              <br />
              has a <span style={{color: C.blue}}>kernel</span>.
            </Headline>

            <Headline f={f} at={T.stack} until={T.chips - 8} y={360}>
              It sits between your
              <br />
              apps and the hardware.
            </Headline>
            <Headline f={f} at={T.chips} until={T.error - 8} y={360}>
              It manages memory,
              <br />
              the processor and
              <br />
              every component.
            </Headline>
            <Headline f={f} at={T.error} until={T.out} y={360}>
              But when it hits an error
              <br />
              it <span style={{color: C.red}}>can’t recover</span> from…
            </Headline>

            {f >= T.stack && (
              <>
                <Box p={stackP(0)} y={760} label="Apps" />
                <Box p={stackP(1)} y={912} label="iOS" />
                <Box
                  p={stackP(2)}
                  y={1064}
                  label={kernelRed > 0.5 ? 'Kernel  ·  Error' : 'Kernel'}
                  accent={kernelRed > 0.5 ? C.red : C.blue}
                  glow={Math.max(f >= T.chips && f < T.error ? 0.5 + 0.5 * Math.sin(f / 8) : 0, kernelRed)}
                />
                <Box p={stackP(3)} y={1216} label="Hardware" />
              </>
            )}
            {f >= T.chips && (
              <div style={{position: 'absolute', left: 0, right: 0, top: 1440, display: 'flex', justifyContent: 'center', gap: 20, opacity: 1 - tw(f, T.error, T.error + 12)}}>
                <Pill p={sp(f, T.chips + 10)}>Memory</Pill>
                <Pill p={sp(f, T.chips + 22)}>Processor</Pill>
                <Pill p={sp(f, T.chips + 34)}>Components</Pill>
              </div>
            )}
          </AbsoluteFill>
        )}

        {/* ---------- 10s: KERNEL PANIC ---------- */}
        <PanicTitle f={f} at={T.panic} until={T.stop - 8} />
        <Slam f={f} at={T.stop} until={T.causes[0] - 8} y={mix(900, 760, tw(f, T.restart, T.restart + 10))} size={230} color={C.red}>
          Stop.
        </Slam>
        <Slam f={f} at={T.restart} until={T.causes[0] - 8} y={980} size={190}>
          Restart.
        </Slam>

        {/* ---------- 14-22s: causes ---------- */}
        <Label f={f} at={T.causes[0]} until={T.spot - 8} y={330}>
          COMMON CAUSES
        </Label>
        {CAUSES.map((c, i) => {
          const at = T.causes[i];
          const until = i < 3 ? T.causes[i + 1] - 6 : T.spot - 8;
          if (f < at || f > until + 10) return null;
          const s = spring({frame: f - at, fps: FPS, config: {damping: 18, stiffness: 200, mass: 0.9}});
          const o = tw(f, until, until + 8, Easing.in(Easing.cubic));
          return (
            <div
              key={c.n}
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
                boxShadow: `0 0 ${60 + hitEnv(f, at, 10) * 80}px color-mix(in srgb, ${c.color} 25%, transparent)`,
              }}
            >
              <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 64, color: c.color}}>{c.n}</div>
              <div>
                <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 150, lineHeight: 0.95, letterSpacing: '-0.04em', color: C.text, whiteSpace: 'pre-line'}}>{c.title}</div>
                <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 46, color: C.grey, marginTop: 30}}>{c.sub}</div>
              </div>
            </div>
          );
        })}
        {f >= T.causes[0] && f < T.spot + 8 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 1420, display: 'flex', justifyContent: 'center', gap: 14, opacity: 1 - tw(f, T.spot - 8, T.spot)}}>
            {CAUSES.map((c, i) => (
              <div key={c.n} style={{width: f >= T.causes[i] && (i === 3 || f < T.causes[i + 1]) ? 48 : 14, height: 14, borderRadius: 7, background: f >= T.causes[i] ? c.color : C.line}} />
            ))}
          </div>
        )}

        {/* ---------- 22-26s: how to spot one (file name only) ---------- */}
        <Label f={f} at={T.spot} until={T.fix[0] - 8} y={560}>
          HOW TO SPOT ONE
        </Label>
        <Slam f={f} at={T.spot} until={T.fix[0] - 8} y={720} size={64} weight={600} spacing="-0.01em" color={C.text}>
          Look for files named
        </Slam>
        {f >= T.spot + 6 && f < T.fix[0] + 8 && (
          <div
            style={{
              position: 'absolute',
              left: 40,
              right: 40,
              top: 840,
              height: 170,
              borderRadius: 44,
              background: C.box,
              border: `2px solid ${C.line}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: MONO,
              fontSize: 46,
              opacity: Math.min(1, sp(f, T.spot + 6, 16, 220)) * (1 - tw(f, T.fix[0] - 8, T.fix[0])),
              transform: `scale(${mix(1.3, 1, Math.min(1, sp(f, T.spot + 6, 16, 220)))})`,
            }}
          >
            {FILE_PARTS.map((p, i) => {
              const on = f >= T.parts[i];
              return (
                <span key={p.text} style={{position: 'relative', color: on ? p.color : C.grey}}>
                  {p.text}
                  <span style={{position: 'absolute', left: 0, right: 0, bottom: -16, height: 6, borderRadius: 3, background: p.color, transform: `scaleX(${tw(f, T.parts[i], T.parts[i] + 10)})`}} />
                </span>
              );
            })}
          </div>
        )}
        {FILE_PARTS.map((p, i) => {
          const at = T.parts[i];
          if (f < at || f >= T.fix[0] + 8) return null;
          return (
            <div key={p.label} style={{position: 'absolute', left: 0, right: 0, top: 1110 + i * 130, display: 'flex', justifyContent: 'center', opacity: 1 - tw(f, T.fix[0] - 8, T.fix[0])}}>
              <Pill p={sp(f, at, 14, 220)} color={p.color} size={42}>
                <span style={{fontFamily: MONO, color: p.color}}>{p.text.replace(/^-/, '')}</span>
                <span style={{color: C.grey}}>{'  →  '}</span>
                {p.label}
              </Pill>
            </div>
          );
        })}

        {/* ---------- 26-32s: what to do ---------- */}
        <Slam f={f} at={T.fix[0]} until={T.fix[1] - 6} y={860} size={190} color={C.green}>
          Rare?
        </Slam>
        <Slam f={f} at={T.fix[0] + 5} until={T.fix[1] - 6} y={1050} size={190}>
          Relax.
        </Slam>
        <Slam f={f} at={T.fix[1]} until={T.fix[2] - 6} y={960} size={190}>
          {'Update\niOS.'}
        </Slam>
        <Slam f={f} at={T.fix[2]} until={T.fix[3] - 6} y={960} size={190}>
          {'Back it\nup.'}
        </Slam>
        <Slam f={f} at={T.fix[3]} until={T.final - 8} y={680} size={130} color={C.red}>
          {'Keeps\nrestarting?'}
        </Slam>
        <Slam f={f} at={T.fix[4]} until={T.final - 8} y={1000} size={110}>
          {'Likely\nhardware.'}
        </Slam>
        {f >= T.fix[5] && f < T.final + 8 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 1240, display: 'flex', justifyContent: 'center', opacity: 1 - tw(f, T.final - 8, T.final)}}>
            <Pill p={sp(f, T.fix[5], 14, 220)} color={C.green} size={60}>
              Get it checked
            </Pill>
          </div>
        )}

        {/* ---------- 32s: final ---------- */}
        <PanicTitle f={f} at={T.final} />
        {f >= T.final + 24 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 1240, display: 'flex', justifyContent: 'center'}}>
            <Pill p={sp(f, T.final + 24, 16, 200)} color={C.blue} size={56}>
              Explained.
            </Pill>
          </div>
        )}
        {f >= T.final + 34 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 1500,
              textAlign: 'center',
              fontFamily: FONT,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 54,
              color: C.text,
              opacity: tw(f, T.final + 34, T.final + 52),
              transform: `translateY(${(1 - tw(f, T.final + 34, T.final + 52)) * 16}px)`,
            }}
          >
            fantexinsta
          </div>
        )}
      </AbsoluteFill>

      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(1 - tw(f, 0, 10), tw(f, T.end - 30, T.end))}} />
    </AbsoluteFill>
  );
};
