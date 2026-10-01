import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolateColors, staticFile, useCurrentFrame} from 'remotion';
import {BigTitle, C, Card, Dots, FONT, Headline, Label, Pill, PillRow, SERIES_T as T, Signature, Slam, hitEnv, mix, sp, tw} from './explained';

// "Explained" episode: thermal throttling. 36s vertical, series theme music.
// Behaviour listed follows Apple's "If your iPhone gets too hot or too cold" support page.
export const THERMAL_DURATION = T.end;

const HITS: [number, number][] = [
  [T.drop, 1],
  ...T.two.map((h): [number, number] => [h, 0.6]),
  ...T.cards.map((h): [number, number] => [h, 0.7]),
  [T.spot, 0.6],
  ...T.parts.map((h): [number, number] => [h, 0.35]),
  ...T.fix.map((h): [number, number] => [h, 0.45]),
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

export const ThermalThrottling: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);

  const [heatAt, sourcesAt, fanAt, hotAt] = T.intro;

  const punch = HITS.reduce((a, [h, s]) => a + hitEnv(f, h, 9) * s * 0.035, 0);
  const shake = hitEnv(f, T.drop, 7) * 20 + hitEnv(f, T.final, 7) * 18 + hitEnv(f, T.drop + 4, 5) * 10;
  const impactZoom = 0.14 * hitEnv(f, T.drop, 10) + 0.12 * hitEnv(f, T.final, 10);
  const flash = Math.max(hitEnv(f, T.drop, 4), hitEnv(f, T.final, 4)) * 0.45;
  const sx = Math.sin(f * 2.7) * shake;
  const sy = Math.cos(f * 3.1) * shake * 0.8;

  const intro = f < T.drop;
  const introOut = tw(f, T.introOut, T.drop - 4);
  const tint =
    f < T.drop ? 'transparent' : f < T.cards[0] ? C.orange : f < T.spot ? CARDS[Math.min(3, Math.floor((f - T.cards[0]) / 60))].color : f < T.fix[0] ? C.green : f < T.fix[3] ? C.orange : f < T.final ? C.green : C.orange;

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden', fontFamily: FONT}}>
      <Audio src={staticFile('kp/music-v3.wav')} />
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
        <Label f={f} at={T.cards[0]} until={T.spot - 8} y={330}>
          WHAT YOUR IPHONE DOES
        </Label>
        {CARDS.map((c, i) => (
          <Card key={c.n} f={f} at={T.cards[i]} until={i < 3 ? T.cards[i + 1] - 6 : T.spot - 8} n={c.n} title={c.title} sub={c.sub} color={c.color} titleSize={118} />
        ))}
        <Dots f={f} starts={T.cards} colors={CARDS.map((c) => c.color)} until={T.spot} y={1420} />

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
        <Slam f={f} at={T.fix[3]} until={T.final - 8} y={700} size={130}>
          {'Not a\ndefect.'}
        </Slam>
        <Slam f={f} at={T.fix[4]} until={T.final - 8} y={1000} size={130} color={C.green}>
          {'It’s\nprotection.'}
        </Slam>
        {f >= T.fix[5] && f < T.final + 8 && (
          <PillRow f={f} until={T.final - 8} y={1240}>
            <Pill p={sp(f, T.fix[5], 14, 220)} color={C.orange} size={52}>
              Heat ages batteries
            </Pill>
          </PillRow>
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
