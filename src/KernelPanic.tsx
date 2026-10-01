import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import timings from './kernelPanicTimings.json';

export const KP_DURATION = timings.total;
const FPS = 30;
const FONT = "'DM Sans', sans-serif";
const MONO = "'DejaVu Sans Mono', 'Liberation Mono', monospace";
const C = {
  bg: '#07080c',
  panel: '#15171d',
  line: '#262a33',
  text: '#ffffff',
  dim: 'rgba(255,255,255,.6)',
  blue: '#0a84ff',
  red: '#ff453a',
  green: '#30d158',
};

type Seg = (typeof timings.segments)[number];
const SEG: Record<string, Seg> = Object.fromEntries(timings.segments.map((s) => [s.key, s]));
const ORDER = timings.segments.map((s) => s.key);
const end = (key: string) => {
  const i = ORDER.indexOf(key);
  return i < ORDER.length - 1 ? SEG[ORDER[i + 1]].from : timings.total;
};
/**
 * Estimated speaking "weight" of a piece of text: characters, plus extra for
 * the pauses the voice makes at punctuation.
 */
const weight = (t: string) => t.length + (t.match(/[.?!]/g) ?? []).length * 9 + (t.match(/,/g) ?? []).length * 4;
/** Frame at which the voice reaches character `idx` of a line. */
const atIndex = (s: Seg, idx: number) => s.from + Math.round((s.duration * weight(s.text.slice(0, idx))) / weight(s.text));
/** Frame at which the voice reaches `word` inside a line. */
const at = (key: string, word: string) => {
  const s = SEG[key];
  return atIndex(s, Math.max(0, s.text.toLowerCase().indexOf(word.toLowerCase())));
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const tw = (f: number, a: number, b: number, e = out) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});
const sp = (f: number, at: number, damping = 15, stiffness = 140) =>
  spring({frame: f - at, fps: FPS, config: {damping, stiffness, mass: 1}});
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** Scene wrapper: visible while its line is the current one, with a soft cross-fade. */
const Scene: React.FC<{k: string; f: number; children: React.ReactNode; until?: string}> = ({k, f, children, until}) => {
  const a = SEG[k].from;
  const b = end(until ?? k);
  if (f < a - 8 || f > b + 8) return null;
  const p = tw(f, a - 6, a + 8) * (1 - tw(f, b - 4, b + 8, Easing.in(Easing.quad)));
  return (
    <AbsoluteFill style={{opacity: p, transform: `translateY(${(1 - tw(f, a - 6, a + 10)) * 40}px)`}}>{children}</AbsoluteFill>
  );
};

const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 160, height: 1150, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
    {children}
  </div>
);

// ---------- phone ----------
const Phone: React.FC<{f: number; homeUntil: number; spinnerFrom: number; label?: React.ReactNode}> = ({f, homeUntil, spinnerFrom, label}) => {
  const glitch = f >= homeUntil - 8 && f < homeUntil;
  const homeOn = f < homeUntil;
  const spin = f >= spinnerFrom;
  return (
    <div
      style={{
        width: 420,
        height: 860,
        borderRadius: 72,
        border: `12px solid #2b2f39`,
        background: '#000',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 40px 120px rgba(0,0,0,.6), inset 0 0 0 2px #3a3f4b',
        transform: glitch ? `translateX(${(random(`g${f}`) - 0.5) * 24}px)` : undefined,
      }}
    >
      <div style={{position: 'absolute', top: 18, left: '50%', width: 120, height: 34, marginLeft: -60, borderRadius: 20, background: '#000', zIndex: 3}} />
      {homeOn && (
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #1f3b73, #5b2a6e)', padding: '110px 36px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 26, alignContent: 'start'}}>
          {Array.from({length: 20}, (_, i) => (
            <div key={i} style={{aspectRatio: '1', borderRadius: 18, background: `hsl(${(i * 47) % 360} 55% ${glitch ? 30 : 55}%)`, opacity: 0.9}} />
          ))}
          {glitch && <div style={{position: 'absolute', inset: 0, background: `linear-gradient(transparent ${random(`l${f}`) * 80}%, ${C.red}88 0, transparent ${random(`l${f}`) * 80 + 6}%)`}} />}
        </div>
      )}
      {spin && (
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 30}}>
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              border: '8px solid rgba(255,255,255,.15)',
              borderTopColor: '#fff',
              transform: `rotate(${(f - spinnerFrom) * 14}deg)`,
              opacity: tw(f, spinnerFrom, spinnerFrom + 8),
            }}
          />
          {label}
        </div>
      )}
    </div>
  );
};

// ---------- system stack (kernel + panic scenes) ----------
const LAYERS = [
  {name: 'APPS', color: '#3a3f4b'},
  {name: 'iOS', color: '#3a3f4b'},
  {name: 'KERNEL', color: C.blue},
  {name: 'HARDWARE', color: '#3a3f4b'},
];

const Stack: React.FC<{f: number; from: number; panic: number; panicFrom: number}> = ({f, from, panic, panicFrom}) => {
  const shake = panic > 0 ? (random(`s${f}`) - 0.5) * 18 * Math.exp(-(f - panicFrom) / 20) : 0;
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
      {LAYERS.map((l, i) => {
        const p = sp(f, from + i * 5);
        const isK = l.name === 'KERNEL';
        const col = isK ? (panic > 0.5 ? C.red : C.blue) : l.color;
        return (
          <div
            key={l.name}
            style={{
              width: 780,
              height: 150,
              borderRadius: 32,
              background: isK ? `${col}22` : C.panel,
              border: `3px solid ${col}`,
              boxShadow: isK ? `0 0 ${60 + panic * 60}px ${col}66` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: isK ? 60 : 50,
              letterSpacing: '0.12em',
              color: isK ? '#fff' : C.dim,
              opacity: Math.min(1, p) * (isK ? 1 : mix(1, 0.35, panic)),
              transform: `translateX(${(1 - p) * (i % 2 ? 300 : -300) + (isK ? shake : 0)}px) scale(${isK ? 1 + panic * 0.06 : 1})`,
            }}
          >
            {isK && panic > 0.5 ? 'PANIC' : l.name}
          </div>
        );
      })}
    </div>
  );
};

const Chip: React.FC<{p: number; children: React.ReactNode; color?: string; size?: number}> = ({p, children, color = C.blue, size = 40}) => (
  <div
    style={{
      padding: '16px 34px',
      borderRadius: 999,
      border: `3px solid ${color}`,
      background: `${color}22`,
      color: '#fff',
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: size,
      opacity: Math.min(1, p),
      transform: `scale(${0.6 + 0.4 * p}) translateY(${(1 - p) * 20}px)`,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

// ---------- captions ----------
const chunks = (text: string, max = 5) => {
  const words = text.split(' ');
  const out: string[] = [];
  for (let i = 0; i < words.length; i += max) out.push(words.slice(i, i + max).join(' '));
  return out;
};

const Captions: React.FC<{f: number}> = ({f}) => {
  const seg = timings.segments.find((s) => f >= s.from && f < s.from + s.duration + 6);
  if (!seg) return null;
  const parts = chunks(seg.text);
  let acc = 0;
  const starts = parts.map((p) => {
    const s = atIndex(seg, acc);
    acc += p.length + 1;
    return s;
  });
  let i = 0;
  while (i < parts.length - 1 && f >= starts[i + 1]) i++;
  const p = tw(f, starts[i], starts[i] + 5);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1430, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 64, lineHeight: 1.2, color: '#fff', textShadow: '0 4px 20px rgba(0,0,0,.8)', opacity: p, transform: `translateY(${(1 - p) * 12}px)`}}>
      {parts[i]}
    </div>
  );
};

// ---------- composition ----------
export const KernelPanic: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);

  const panicP = tw(f, at('panic', 'error'), at('panic', 'error') + 10);
  const redMood = tw(f, SEG.panic.from, SEG.panic.from + 20) * (1 - tw(f, SEG.causes.from - 10, SEG.causes.from + 10));
  const glowColor = redMood > 0.5 ? C.red : C.blue;
  const panicFlash = f >= at('panic', 'error') ? Math.exp(-(f - at('panic', 'error')) / 6) : 0;

  const causes = [
    {k: 'software', title: 'Software bugs', sub: 'in iOS or an app'},
    {k: 'faulty', title: 'Faulty hardware', sub: 'battery, cables, sensors'},
    {k: 'repairs', title: 'Non-genuine parts', sub: 'after a repair'},
    {k: 'jailbreak', title: 'Jailbreak tweaks', sub: 'modified system'},
  ];
  const path = [
    {k: 'settings', t: 'Settings'},
    {k: 'privacy', t: 'Privacy & Security'},
    {k: 'improvements', t: 'Analytics & Improvements'},
    {k: 'analytics data', t: 'Analytics Data'},
  ];
  const fixes = [
    {k: 'nothing', t: 'Rare panic? No worries', c: C.green},
    {k: 'updated', t: 'Keep iOS updated', c: C.green},
    {k: 'backup', t: 'Keep a backup', c: C.green},
  ];

  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <Audio src={staticFile('kp/music.wav')} volume={0.22} />
      {timings.segments.map((s) => (
        <Sequence key={s.key} from={s.from} durationInFrames={s.duration + 10}>
          <Audio src={staticFile(s.file)} volume={1} />
        </Sequence>
      ))}

      {/* background: grid + glow */}
      <AbsoluteFill
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.035) 2px, transparent 2px)',
          backgroundSize: '90px 90px',
          backgroundPosition: `0 ${(f * 0.6) % 90}px`,
        }}
      />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 40% at 50% 38%, ${glowColor}2e, transparent 70%)`}} />
      <AbsoluteFill style={{background: C.red, opacity: panicFlash * 0.35, mixBlendMode: 'screen'}} />

      {/* hook */}
      <Scene k="hook" f={f}>
        <Stage>
          <Phone f={f} homeUntil={at('hook', 'restarted') + 4} spinnerFrom={at('hook', 'restarted') + 10} />
        </Stage>
      </Scene>

      {/* name */}
      <Scene k="name" f={f}>
        <Stage>
          {['KERNEL', 'PANIC'].map((w, i) => {
            const p = sp(f, SEG.name.from + 10 + i * 8, 12, 160);
            const g = i === 1 ? (random(`n${Math.floor(f / 3)}`) - 0.5) * 10 : 0;
            return (
              <div key={w} style={{position: 'relative', fontFamily: FONT, fontWeight: 700, fontSize: 210, lineHeight: 1, letterSpacing: '-0.02em', color: i ? C.red : '#fff', opacity: Math.min(1, p), transform: `scale(${mix(1.5, 1, p)}) translateX(${g}px)`}}>
                {i === 1 && <span style={{position: 'absolute', left: 6, top: 0, color: '#00e5ff', opacity: 0.5, mixBlendMode: 'screen'}}>{w}</span>}
                {w}
              </div>
            );
          })}
          <div style={{marginTop: 60, fontFamily: FONT, fontSize: 46, color: C.dim, opacity: tw(f, at('name', 'here'), at('name', 'here') + 10)}}>explained in under a minute</div>
        </Stage>
      </Scene>

      {/* kernel + panic share the stack */}
      <Scene k="kernel" f={f} until="panic">
        <Stage>
          <Stack f={f} from={SEG.kernel.from} panic={panicP} panicFrom={at('panic', 'error')} />
          <div style={{display: 'flex', gap: 22, marginTop: 60, height: 100}}>
            {f < SEG.panic.from ? (
              <>
                <Chip p={sp(f, at('kernel', 'memory'))}>Memory</Chip>
                <Chip p={sp(f, at('kernel', 'processor'))}>Processor</Chip>
                <Chip p={sp(f, at('kernel', 'component'))}>Components</Chip>
              </>
            ) : (
              <Chip p={sp(f, at('panic', 'recover'))} color={C.red} size={44}>
                Can’t safely recover
              </Chip>
            )}
          </div>
        </Stage>
      </Scene>

      {/* restart */}
      <Scene k="restart" f={f}>
        <Stage>
          <div style={{display: 'flex', gap: 22, marginBottom: 50, height: 100}}>
            <Chip p={sp(f, at('restart', 'stops'))} color={C.red}>
              Stop everything
            </Chip>
            <Chip p={sp(f, at('restart', 'restarts'))} color="#ffffff">
              Restart
            </Chip>
          </div>
          <Phone
            f={f}
            homeUntil={SEG.restart.from}
            spinnerFrom={at('restart', 'restarts')}
            label={<div style={{fontFamily: FONT, fontWeight: 700, fontSize: 34, color: C.green, opacity: tw(f, at('restart', 'restarts') + 12, at('restart', 'restarts') + 22)}}>Your data is safe</div>}
          />
        </Stage>
      </Scene>

      {/* causes */}
      <Scene k="causes" f={f}>
        <Stage>
          <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 64, color: '#fff', marginBottom: 50, opacity: tw(f, SEG.causes.from, SEG.causes.from + 10)}}>Common causes</div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28}}>
            {causes.map((c, i) => {
              const p = sp(f, at('causes', c.k));
              return (
                <div key={c.k} style={{width: 440, height: 300, borderRadius: 36, background: C.panel, border: `3px solid ${C.line}`, padding: 36, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: Math.min(1, p), transform: `scale(${mix(0.7, 1, p)})`}}>
                  <div style={{fontFamily: MONO, fontSize: 34, color: C.red}}>0{i + 1}</div>
                  <div>
                    <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 44, color: '#fff', lineHeight: 1.1}}>{c.title}</div>
                    <div style={{fontFamily: FONT, fontSize: 30, color: C.dim, marginTop: 10}}>{c.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Stage>
      </Scene>

      {/* check */}
      <Scene k="check" f={f}>
        <Stage>
          <div style={{width: 860, borderRadius: 36, background: C.panel, overflow: 'hidden', border: `3px solid ${C.line}`}}>
            {path.map((r, i) => {
              const on = f >= at('check', r.k);
              const p = sp(f, at('check', r.k));
              return (
                <div key={r.k} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 44px', height: 130, borderTop: i ? `2px solid ${C.line}` : 'none', background: on ? `rgba(10,132,255,${0.25 * Math.min(1, p)})` : 'transparent', fontFamily: FONT, fontSize: 46, fontWeight: on ? 700 : 500, color: on ? '#fff' : 'rgba(255,255,255,.35)'}}>
                  <span style={{paddingLeft: i * 18}}>{r.t}</span>
                  <span style={{color: on ? C.blue : 'rgba(255,255,255,.25)', fontSize: 52}}>›</span>
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 50,
              padding: '30px 40px',
              borderRadius: 28,
              border: `3px solid ${C.red}`,
              background: `${C.red}1f`,
              fontFamily: MONO,
              fontSize: 40,
              color: '#fff',
              opacity: Math.min(1, sp(f, at('check', 'look'))),
              transform: `scale(${mix(0.8, 1, Math.min(1, sp(f, at('check', 'look'))))})`,
              boxShadow: `0 0 50px ${C.red}55`,
            }}
          >
            <span style={{color: C.red}}>panic-full</span>-2026-10-01.ips
          </div>
        </Stage>
      </Scene>

      {/* fix */}
      <Scene k="fix" f={f}>
        <Stage>
          <div style={{display: 'flex', flexDirection: 'column', gap: 30}}>
            {fixes.map((x) => {
              const p = sp(f, at('fix', x.k));
              return (
                <div key={x.k} style={{display: 'flex', alignItems: 'center', gap: 36, width: 860, height: 170, padding: '0 44px', boxSizing: 'border-box', borderRadius: 36, background: C.panel, border: `3px solid ${C.line}`, opacity: Math.min(1, p), transform: `translateX(${(1 - p) * -200}px)`}}>
                  <div style={{width: 84, height: 84, borderRadius: '50%', background: x.c, color: '#000', fontFamily: FONT, fontWeight: 700, fontSize: 52, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✓</div>
                  <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 52, color: '#fff'}}>{x.t}</div>
                </div>
              );
            })}
          </div>
        </Stage>
      </Scene>

      {/* frequent */}
      <Scene k="frequent" f={f}>
        <Stage>
          <div style={{position: 'relative', width: 300, height: 300, marginBottom: 70}}>
            <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: `14px solid ${C.red}33`}} />
            <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: '14px solid transparent', borderTopColor: C.red, borderRightColor: C.red, transform: `rotate(${(f - SEG.frequent.from) * 9}deg)`}} />
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 64, color: '#fff'}}>
              ×{1 + Math.floor(Math.max(0, f - SEG.frequent.from) / 24)}
            </div>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28}}>
            <Chip p={sp(f, at('frequent', 'minutes'))} color={C.red} size={48}>
              Restarts every few minutes
            </Chip>
            <Chip p={sp(f, at('frequent', 'hardware'))} color={C.red} size={48}>
              Often hardware
            </Chip>
            <Chip p={sp(f, at('frequent', 'checked'))} color={C.green} size={48}>
              Get it checked
            </Chip>
          </div>
        </Stage>
      </Scene>

      {/* outro */}
      <Scene k="outro" f={f}>
        <Stage>
          <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 150, lineHeight: 1.02, textAlign: 'center', color: '#fff', letterSpacing: '-0.02em'}}>
            <div style={{opacity: Math.min(1, sp(f, SEG.outro.from + 4))}}>Kernel panic,</div>
            <div style={{color: C.blue, opacity: Math.min(1, sp(f, SEG.outro.from + 14))}}>explained.</div>
          </div>
        </Stage>
      </Scene>

      <Captions f={f} />
      <AbsoluteFill style={{background: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,.55) 100%)'}} />
      <AbsoluteFill style={{background: '#000', opacity: tw(f, timings.total - 20, timings.total)}} />
    </AbsoluteFill>
  );
};
