import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolateColors, staticFile, useCurrentFrame} from 'remotion';
import {BigTitle, C, Dots, FONT, Headline, Label, Pill, PillRow, SERIES_T, Signature, Slam, hitEnv, mix, sp, tw} from './explained';
import {HomeGrid, IPhone, PHONE_W, SignalBars, StatusBar} from './IPhoneMock';

// "Explained" episode: thermal throttling. 44s vertical: the series layout plus an extra
// 32-40s section on the iPhone 18 Pro vapor chamber (music: scripts/make_music_thermal.py).
// Behaviour listed follows Apple's "If your iPhone gets too hot or too cold" support page;
// vapor chamber figures are Apple's (Newsroom, "Apple debuts iPhone 18 Pro and iPhone 18 Pro Max").
const T = {...SERIES_T, vc: 960, vcSteps: [1020, 1080, 1140], final: 1200, end: 1320};
export const THERMAL_DURATION = T.end;
const CYAN = '#64d2ff';

const HITS: [number, number][] = [
  [T.drop, 1],
  ...T.two.map((h): [number, number] => [h, 0.6]),
  ...T.cards.map((h): [number, number] => [h, 0.7]),
  [T.spot, 0.6],
  ...T.parts.map((h): [number, number] => [h, 0.35]),
  ...T.fix.map((h): [number, number] => [h, 0.45]),
  [T.vc, 0.9],
  ...T.vcSteps.map((h): [number, number] => [h, 0.6]),
  [T.final, 1],
];

const CARDS = [
  {n: '01', title: 'Less\nperformance', sub: 'CPU and GPU slow down', color: C.orange},
  {n: '02', title: 'Dimmer\ndisplay', sub: 'Brightness drops', color: C.yellow},
  {n: '03', title: 'Charging\npauses', sub: 'Until it cools down', color: C.red},
  {n: '04', title: 'Weaker\nsignal', sub: 'Radios save power', color: C.blue},
];

/** Rounded temperature gauge for the intro */
const Gauge: React.FC<{f: number}> = ({f}) => {
  const [, warmAt, fanAt, hotAt] = T.intro;
  const level = Math.max(
    0.18,
    mix(0.18, 0.55, tw(f, warmAt + 10, fanAt, Easing.inOut(Easing.quad))) +
      tw(f, fanAt, hotAt, Easing.inOut(Easing.quad)) * 0.2 +
      tw(f, hotAt + 6, hotAt + 40, Easing.out(Easing.cubic)) * 0.25,
  );
  const col = interpolateColors(level, [0.18, 0.5, 0.75, 1], [C.green, C.yellow, C.orange, C.red]);
  const status = level > 0.9 ? 'Too hot' : level > 0.6 ? 'Hot' : level > 0.35 ? 'Warm' : 'Normal';
  const p = sp(f, warmAt);
  const hot = tw(f, hotAt + 30, hotAt + 40);
  return (
    <div
      style={{
        position: 'absolute',
        left: 150,
        width: 780,
        top: 820,
        height: 230,
        borderRadius: 44,
        background: C.box,
        border: `2px solid ${hot > 0.5 ? C.red : C.line}`,
        boxShadow: hot > 0 ? `0 0 ${60 + 40 * Math.sin(f / 5)}px color-mix(in srgb, ${C.red} 35%, transparent)` : 'none',
        padding: '40px 48px',
        boxSizing: 'border-box',
        opacity: Math.min(1, p),
        transform: `translateY(${(1 - p) * 40}px)`,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontWeight: 600, fontSize: 44}}>
        <span style={{color: C.grey}}>Temperature</span>
        <span style={{color: col}}>{status}</span>
      </div>
      <div style={{marginTop: 36, height: 44, borderRadius: 22, background: '#2c2c2e', overflow: 'hidden'}}>
        <div style={{width: `${level * 100}%`, height: '100%', borderRadius: 22, background: `linear-gradient(90deg, ${C.green}, ${col})`}} />
      </div>
    </div>
  );
};

/** One iPhone that shows, in turn, the four things iOS does when it is too hot */
const PhoneDemo: React.FC<{f: number}> = ({f}) => {
  if (f < T.cards[0] - 2 || f > T.spot + 4) return null;
  const enter = sp(f, T.cards[0], 18, 120);
  const exit = tw(f, T.spot - 10, T.spot + 2, Easing.in(Easing.cubic));
  const lt = (i: number) => f - T.cards[i];
  const show = (i: number) => {
    const a = T.cards[i];
    const b = i < 3 ? T.cards[i + 1] : T.spot + 10;
    return tw(f, a - 4, a + 4) * (1 - (i < 3 ? tw(f, b - 4, b + 4) : 0));
  };
  const state = Math.max(0, Math.min(3, Math.floor((f - T.cards[0]) / 60)));

  // 1. performance: FPS drop
  const fpsP = tw(lt(0), 8, 42, Easing.inOut(Easing.quad));
  const fps = Math.round(60 - 30 * fpsP);
  const chart = Array.from({length: 28}, (_, k) => {
    const x = (k / 27) * 400;
    const drop = Math.min(1, Math.max(0, (k / 27) * 1.4 - 0.25));
    const y = 30 + drop * 120 + Math.sin(k * 1.7) * 8;
    return `${x},${y}`;
  }).join(' ');
  // 2. brightness
  const dim = tw(lt(1), 6, 40, Easing.inOut(Easing.quad));
  // 3. charging banner
  const banner = sp(f, T.cards[2] + 10, 16, 160);
  // 4. signal
  const bars = 4 - Math.round(tw(lt(3), 6, 40) * 3);

  return (
    <IPhone style={{left: (1080 - PHONE_W) / 2, top: 600, opacity: Math.min(1, enter * 1.4) * (1 - exit), transform: `translateY(${(1 - enter) * 700 + exit * 400}px) scale(${1 + hitEnv(f, T.cards[state], 8) * 0.015})`}}>
      {/* 1. less performance */}
      <div style={{position: 'absolute', inset: 0, opacity: show(0), background: 'linear-gradient(180deg, #0b0f1a, #141826)', fontFamily: FONT}}>
        <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontSize: 30, fontWeight: 600, color: C.grey, letterSpacing: '0.2em'}}>FRAME RATE</div>
        <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', fontSize: 190, fontWeight: 700, letterSpacing: '-0.04em', color: fpsP < 0.5 ? C.green : C.orange}}>{fps}</div>
        <div style={{position: 'absolute', top: 410, left: 0, right: 0, textAlign: 'center', fontSize: 34, fontWeight: 600, color: C.text}}>FPS</div>
        <svg width={400} height={190} style={{position: 'absolute', left: 38, top: 490, clipPath: `inset(0 ${100 - fpsP * 100}% 0 0)`}}>
          <polyline points={chart} fill="none" stroke={C.orange} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {['CPU', 'GPU'].map((n, k) => (
          <div key={n} style={{position: 'absolute', left: 44, right: 44, top: 720 + k * 90}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 28, fontWeight: 600, color: C.grey}}>
              <span>{n}</span>
              <span>{Math.round(100 - 45 * fpsP)}%</span>
            </div>
            <div style={{marginTop: 10, height: 18, borderRadius: 9, background: '#2c2c2e'}}>
              <div style={{width: `${100 - 45 * fpsP}%`, height: '100%', borderRadius: 9, background: fpsP < 0.5 ? C.green : C.orange}} />
            </div>
          </div>
        ))}
        <StatusBar />
      </div>

      {/* 2. dimmer display */}
      <div style={{position: 'absolute', inset: 0, opacity: show(1)}}>
        <HomeGrid />
        <div style={{position: 'absolute', inset: 0, background: '#000', opacity: dim * 0.65}} />
        <div style={{position: 'absolute', right: 40, top: 300, width: 130, height: 380, borderRadius: 44, background: 'rgba(60,60,64,.75)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,.4)'}}>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${mix(88, 25, dim)}%`, background: '#f5f5f7'}} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 26, textAlign: 'center', fontSize: 52, color: '#888'}}>☀</div>
        </div>
        <StatusBar />
      </div>

      {/* 3. charging on hold */}
      <div style={{position: 'absolute', inset: 0, opacity: show(2), background: 'linear-gradient(170deg, #182848 0%, #3b1e54 60%, #6a2c47 100%)', fontFamily: FONT}}>
        <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', fontSize: 32, fontWeight: 600, color: 'rgba(255,255,255,.85)'}}>Thursday 1 October</div>
        <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontSize: 170, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em'}}>9:41</div>
        <div
          style={{
            position: 'absolute',
            left: 22,
            right: 22,
            top: 470,
            borderRadius: 40,
            background: 'rgba(30,30,34,.88)',
            padding: '28px 30px',
            boxShadow: '0 20px 50px rgba(0,0,0,.45)',
            opacity: Math.min(1, banner * 1.5),
            transform: `translateY(${(1 - banner) * -120}px) scale(${0.92 + 0.08 * Math.min(1, banner)})`,
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <div style={{width: 52, height: 52, borderRadius: 14, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30}}>⚡</div>
            <div style={{fontSize: 32, fontWeight: 700, color: '#fff'}}>Charging On Hold</div>
          </div>
          <div style={{marginTop: 14, fontSize: 28, lineHeight: 1.3, color: 'rgba(255,255,255,.8)'}}>Charging will resume when iPhone returns to normal temperature.</div>
        </div>
        <StatusBar battery={0.62} charging={banner < 0.5} batteryColor={banner < 0.5 ? C.green : '#fff'} />
      </div>

      {/* 4. weaker signal */}
      <div style={{position: 'absolute', inset: 0, opacity: show(3)}}>
        <HomeGrid />
        <div style={{position: 'absolute', inset: 0, background: '#000', opacity: 0.45}} />
        <div style={{position: 'absolute', left: 60, right: 60, top: 300, height: 360, borderRadius: 48, background: 'rgba(28,28,30,.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30, fontFamily: FONT}}>
          <SignalBars bars={bars} size={140} color={bars <= 1 ? C.orange : '#fff'} />
          <div style={{fontSize: 34, fontWeight: 600, color: bars <= 1 ? C.orange : C.text}}>{bars <= 1 ? 'Low-power mode' : 'Cellular'}</div>
        </div>
        <StatusBar bars={bars} barsColor={bars <= 1 ? C.orange : '#fff'} />
      </div>
    </IPhone>
  );
};

/** Flat vapor chamber: liquid evaporates over the hot chip, spreads to the cool edges and returns */
const VaporDiagram: React.FC<{f: number}> = ({f}) => {
  const a = T.vcSteps[0];
  const b = T.vcSteps[1];
  if (f < a - 2 || f > b + 6) return null;
  const p = sp(f, a, 16, 160);
  const o = tw(f, b - 6, b + 2);
  const lt = f - a;
  const W = 900;
  const H = 300;
  const steps = [
    {at: a + 10, t: 'Evaporates', c: C.orange},
    {at: a + 22, t: 'Spreads', c: '#ffffff'},
    {at: a + 34, t: 'Condenses', c: CYAN},
  ];
  return (
    <div style={{position: 'absolute', left: 90, top: 760, width: W, opacity: Math.min(1, p) * (1 - o), transform: `translateY(${(1 - Math.min(1, p)) * 60}px)`}}>
      <div style={{position: 'relative', width: W, height: H, borderRadius: 60, border: `3px solid ${CYAN}`, background: 'linear-gradient(180deg, rgba(100,210,255,.10), rgba(100,210,255,.03))', overflow: 'hidden'}}>
        {/* the chip, glowing hot underneath the middle */}
        <div style={{position: 'absolute', left: W / 2 - 110, bottom: 24, width: 220, height: 90, borderRadius: 20, background: `color-mix(in srgb, ${C.orange} 35%, #1c1c1e)`, border: `2px solid ${C.orange}`, boxShadow: `0 0 ${50 + 20 * Math.sin(f / 4)}px ${C.orange}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 36, color: '#fff'}}>
          A20 Pro
        </div>
        {/* vapor particles */}
        {Array.from({length: 46}, (_, i) => {
          const side = i % 2 ? 1 : -1;
          const ph = ((lt * (0.022 + (i % 5) * 0.003) + i * 0.137) % 1 + 1) % 1;
          let x: number;
          let y: number;
          let col: string;
          if (ph < 0.6) {
            const q = ph / 0.6; // rising from the chip and spreading out along the top
            x = W / 2 + side * q * (W / 2 - 50);
            y = H - 120 - Math.sin(Math.min(1, q * 2) * Math.PI / 2) * 120 - 20;
            col = interpolateColors(q, [0, 1], [C.orange, CYAN]);
          } else {
            const q = (ph - 0.6) / 0.4; // condensed liquid flowing back along the bottom
            x = W / 2 + side * (1 - q) * (W / 2 - 50);
            y = H - 40;
            col = CYAN;
          }
          const size = ph < 0.6 ? 12 : 8;
          return <div key={i} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', background: col, boxShadow: `0 0 12px ${col}`, opacity: 0.9}} />;
        })}
      </div>
      <div style={{display: 'flex', justifyContent: 'center', gap: 18, marginTop: 50}}>
        {steps.map((s) => (
          <Pill key={s.t} p={sp(f, s.at, 14, 220)} color={s.c === '#ffffff' ? undefined : s.c} size={40}>
            {s.t}
          </Pill>
        ))}
      </div>
    </div>
  );
};

/** iPhone 17 Pro vs iPhone 18 Pro vapor chamber area (3x) */
const AreaCompare: React.FC<{f: number}> = ({f}) => {
  const a = T.vcSteps[1];
  const b = T.vcSteps[2];
  if (f < a - 2 || f > b + 6) return null;
  const o = tw(f, b - 6, b + 2);
  const small = sp(f, a + 6, 16, 180);
  const big = sp(f, a + 16, 13, 150);
  const k = Math.sqrt(3);
  const box = (w: number, h: number, p: number, label: string, col: string) => (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
      <div style={{width: w * Math.min(1.05, p), height: h * Math.min(1.05, p), borderRadius: 34, border: `3px solid ${col}`, background: `color-mix(in srgb, ${col} 14%, transparent)`, opacity: Math.min(1, p * 1.5)}} />
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 40, color: col, opacity: Math.min(1, p)}}>{label}</div>
    </div>
  );
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1020, height: 420, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 60, opacity: 1 - o}}>
      {box(280, 168, small, 'iPhone 17 Pro', C.grey)}
      {box(280 * k, 168 * k, big, 'iPhone 18 Pro', CYAN)}
    </div>
  );
};

export const ThermalThrottling: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);

  const [heatAt, sourcesAt, fanAt, hotAt] = T.intro;

  const punch = HITS.reduce((a, [h, s]) => a + hitEnv(f, h, 9) * s * 0.035, 0);
  const shake = hitEnv(f, T.drop, 7) * 20 + hitEnv(f, T.final, 7) * 18 + hitEnv(f, T.drop + 4, 5) * 10 + hitEnv(f, T.vc, 7) * 14;
  const impactZoom = 0.14 * hitEnv(f, T.drop, 10) + 0.12 * hitEnv(f, T.final, 10) + 0.1 * hitEnv(f, T.vc, 10);
  const flash = Math.max(hitEnv(f, T.drop, 4), hitEnv(f, T.final, 4), hitEnv(f, T.vc, 4) * 0.8) * 0.45;
  const sx = Math.sin(f * 2.7) * shake;
  const sy = Math.cos(f * 3.1) * shake * 0.8;

  const intro = f < T.drop;
  const introOut = tw(f, T.introOut, T.drop - 4);
  const tint =
    f < T.drop ? 'transparent' : f < T.cards[0] ? C.orange : f < T.spot ? CARDS[Math.min(3, Math.floor((f - T.cards[0]) / 60))].color : f < T.fix[0] ? C.green : f < T.fix[3] ? C.orange : f < T.vc ? C.green : f < T.final ? CYAN : C.orange;

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden', fontFamily: FONT}}>
      <Audio src={staticFile('kp/music-thermal.wav')} />
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${1 + punch + impactZoom})`}}>
        {!intro && <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 45% at 50% 50%, color-mix(in srgb, ${tint} 22%, transparent), transparent 70%)`}} />}

        {/* ---------- 0-10s: minimal explanation ---------- */}
        {intro && (
          <AbsoluteFill style={{opacity: 1 - introOut, transform: `scale(${1 - introOut * 0.04})`}}>
            <Headline f={f} at={heatAt} until={sourcesAt - 8} y={860} size={84}>
              Every iPhone
              <br />
              makes <span style={{color: C.orange}}>heat</span>.
            </Headline>
            <Headline f={f} at={sourcesAt} until={fanAt - 8} y={420}>
              Gaming, 4K video,
              <br />
              charging, the sun…
            </Headline>
            <Headline f={f} at={fanAt} until={hotAt - 8} y={420}>
              And there’s no fan.
              <br />
              It cools through its body.
            </Headline>
            <Headline f={f} at={hotAt} until={T.introOut} y={420}>
              So when it gets
              <br />
              <span style={{color: C.red}}>too hot</span>…
            </Headline>
            {f >= sourcesAt && <Gauge f={f} />}
            {f >= sourcesAt && f < fanAt + 10 && (
              <PillRow f={f} until={fanAt - 8} y={1130} wrap>
                <Pill p={sp(f, sourcesAt + 8)}>Gaming</Pill>
                <Pill p={sp(f, sourcesAt + 18)}>4K video</Pill>
                <Pill p={sp(f, sourcesAt + 28)}>Charging</Pill>
                <Pill p={sp(f, sourcesAt + 38)}>Sun</Pill>
              </PillRow>
            )}
            {f >= fanAt && f < hotAt + 10 && (
              <PillRow f={f} until={hotAt - 8} y={1130}>
                <Pill p={sp(f, fanAt + 10)}>No fan</Pill>
                <Pill p={sp(f, fanAt + 22)}>Passive cooling</Pill>
              </PillRow>
            )}
          </AbsoluteFill>
        )}

        {/* ---------- 10s: the title ---------- */}
        <BigTitle f={f} at={T.drop} until={T.two[0] - 8} first="Thermal" second="throttling." firstSize={190} secondSize={168} color={C.orange} />
        <Slam f={f} at={T.two[0]} until={T.cards[0] - 8} y={mix(920, 830, tw(f, T.two[1], T.two[1] + 10))} size={160} color={C.orange}>
          Slow down.
        </Slam>
        <Slam f={f} at={T.two[1]} until={T.cards[0] - 8} y={1010} size={160}>
          Cool down.
        </Slam>

        {/* ---------- 14-22s: what your iPhone does ---------- */}
        <Label f={f} at={T.cards[0]} until={T.spot - 8} y={250}>
          WHAT YOUR IPHONE DOES
        </Label>
        {CARDS.map((c, i) => {
          const until = i < 3 ? T.cards[i + 1] - 4 : T.spot - 8;
          return (
            <React.Fragment key={c.n}>
              <Slam f={f} at={T.cards[i]} until={until} y={400} size={104} color={c.color}>
                {c.title.replace('\n', ' ')}
              </Slam>
              {f >= T.cards[i] && f < until + 8 && (
                <div style={{position: 'absolute', left: 0, right: 0, top: 478, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 42, color: C.grey, opacity: tw(f, T.cards[i] + 4, T.cards[i] + 14) * (1 - tw(f, until, until + 6))}}>
                  {c.sub}
                </div>
              )}
            </React.Fragment>
          );
        })}
        <PhoneDemo f={f} />
        <Dots f={f} starts={T.cards} colors={CARDS.map((c) => c.color)} until={T.spot} y={1720} />

        {/* ---------- 22-26s: comfort zone ---------- */}
        <Label f={f} at={T.spot} until={T.fix[0] - 8} y={560}>
          COMFORT ZONE
        </Label>
        <Slam f={f} at={T.spot} until={T.fix[0] - 8} y={790} size={230} color={C.green}>
          0–35 °C
        </Slam>
        <Slam f={f} at={T.spot + 6} until={T.fix[0] - 8} y={960} size={70} weight={600} spacing="-0.01em" color={C.grey}>
          32–95 °F
        </Slam>
        {f >= T.parts[0] && f < T.fix[0] + 10 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 1100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: 1 - tw(f, T.fix[0] - 8, T.fix[0])}}>
            <Pill p={sp(f, T.parts[0], 14, 220)} size={44}>
              Ambient temperature
            </Pill>
            {f >= T.parts[1] && (
              <Pill p={sp(f, T.parts[1], 14, 220)} size={44}>
                Recommended by Apple
              </Pill>
            )}
            {f >= T.parts[2] && (
              <Pill p={sp(f, T.parts[2], 14, 220)} color={C.orange} size={44}>
                Hotter? iOS protects itself
              </Pill>
            )}
          </div>
        )}

        {/* ---------- 26-32s: what to do ---------- */}
        <Slam f={f} at={T.fix[0]} until={T.fix[1] - 6} y={860} size={180} color={C.orange}>
          Too hot?
        </Slam>
        <Slam f={f} at={T.fix[0] + 5} until={T.fix[1] - 6} y={1050} size={180}>
          Pause it.
        </Slam>
        <Slam f={f} at={T.fix[1]} until={T.fix[2] - 6} y={960} size={180}>
          {'Out of\nthe sun.'}
        </Slam>
        <Slam f={f} at={T.fix[2]} until={T.fix[3] - 6} y={960} size={150}>
          {'Case off\nwhile\ncharging.'}
        </Slam>
        <Slam f={f} at={T.fix[3]} until={T.vc - 8} y={700} size={130}>
          {'Not a\ndefect.'}
        </Slam>
        <Slam f={f} at={T.fix[4]} until={T.vc - 8} y={1000} size={130} color={C.green}>
          {'It’s\nprotection.'}
        </Slam>
        {f >= T.fix[5] && f < T.vc + 8 && (
          <PillRow f={f} until={T.vc - 8} y={1240}>
            <Pill p={sp(f, T.fix[5], 14, 220)} color={C.orange} size={52}>
              Heat ages batteries
            </Pill>
          </PillRow>
        )}

        {/* ---------- 32-40s: iPhone 18 Pro vapor chamber ---------- */}
        <Label f={f} at={T.vc} until={T.final - 8} y={250} color={CYAN}>
          NEW ON IPHONE 18 PRO
        </Label>
        <BigTitle f={f} at={T.vc} until={T.vcSteps[0] - 8} first="Vapor" second="chamber." color={CYAN} />
        <Slam f={f} at={T.vcSteps[0]} until={T.vcSteps[1] - 6} y={470} size={66} weight={700} spacing="-0.02em">
          {'Heat turns liquid into vapor.\nIt spreads, cools, and returns.'}
        </Slam>
        <VaporDiagram f={f} />
        <Slam f={f} at={T.vcSteps[1]} until={T.vcSteps[2] - 6} y={640} size={360} color={CYAN}>
          3×
        </Slam>
        {f >= T.vcSteps[1] && f < T.vcSteps[2] + 6 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 860, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 48, color: C.grey, opacity: tw(f, T.vcSteps[1] + 6, T.vcSteps[1] + 16) * (1 - tw(f, T.vcSteps[2] - 6, T.vcSteps[2]))}}>
            the surface area of iPhone 17 Pro
          </div>
        )}
        <AreaCompare f={f} />
        <Slam f={f} at={T.vcSteps[2]} until={T.final - 8} y={760} size={175} color={CYAN}>
          Up to 40%
        </Slam>
        {f >= T.vcSteps[2] && f < T.final + 6 && (
          <>
            <div style={{position: 'absolute', left: 0, right: 0, top: 880, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 52, color: C.text, opacity: tw(f, T.vcSteps[2] + 6, T.vcSteps[2] + 16) * (1 - tw(f, T.final - 8, T.final))}}>
              more sustained performance
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: 1 - tw(f, T.final - 8, T.final)}}>
              <Pill p={sp(f, T.vcSteps[2] + 14, 14, 220)} color={CYAN} size={44}>
                A20 Pro sits directly on it
              </Pill>
              {f >= T.vcSteps[2] + 26 && (
                <Pill p={sp(f, T.vcSteps[2] + 26, 14, 220)} size={44}>
                  Chip and memory side by side
                </Pill>
              )}
            </div>
          </>
        )}

        {/* ---------- 32s: final ---------- */}
        <BigTitle f={f} at={T.final} first="Thermal" second="throttling." firstSize={190} secondSize={168} color={C.orange} />
        {f >= T.final + 24 && (
          <PillRow f={f} until={T.end + 100} y={1240}>
            <Pill p={sp(f, T.final + 24, 16, 200)} color={C.blue} size={56}>
              Explained.
            </Pill>
          </PillRow>
        )}
        <Signature f={f} at={T.final + 34} />
      </AbsoluteFill>

      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(1 - tw(f, 0, 10), tw(f, T.end - 30, T.end))}} />
    </AbsoluteFill>
  );
};
