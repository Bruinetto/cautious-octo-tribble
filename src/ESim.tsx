import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {BigTitle, C, Dots, FONT, Headline, Label, Pill, PillRow, SERIES_T as T, Signature, Slam, hitEnv, mix, sp, tw} from './explained';
import {IPhone, PHONE_W, StatusBar} from './IPhoneMock';

// "Explained" episode: eSIM. 36s vertical, series theme music (public/kp/music-v3.wav).
// iPhone 18 Pro eSIM-only market list as reported (MacObserver and others, Sept 2026).
export const ESIM_DURATION = T.end;
const ACCENT = C.green;

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
  {title: 'Two lines at once', sub: 'Dual eSIM, both active', color: C.green},
  {title: '8+ eSIMs stored', sub: 'Switch lines anytime', color: C.blue},
  {title: 'Travel plans', sub: 'Ready before you land', color: C.purple},
  {title: 'Nothing to pull out', sub: 'No card for a thief to swap', color: C.orange},
];

// ---------- intro drawings ----------
const SimCard: React.FC<{w: number}> = ({w}) => {
  const h = w * 0.68;
  return (
    <div style={{position: 'relative', width: w, height: h, clipPath: `polygon(${w * 0.16}px 0, 100% 0, 100% 100%, 0 100%, 0 ${h * 0.24}px)`, borderRadius: w * 0.06, background: 'linear-gradient(135deg, #f5f5f7, #c7c7cc)', boxShadow: '0 30px 60px rgba(0,0,0,.5)'}}>
      <div
        style={{
          position: 'absolute',
          left: w * 0.3,
          top: h * 0.24,
          width: w * 0.4,
          height: h * 0.52,
          borderRadius: w * 0.05,
          background: 'linear-gradient(135deg, #f7d77c, #c9952b 60%, #f2cf6e)',
          backgroundImage: `linear-gradient(90deg, transparent 32%, rgba(0,0,0,.25) 32%, rgba(0,0,0,.25) 34%, transparent 34%, transparent 66%, rgba(0,0,0,.25) 66%, rgba(0,0,0,.25) 68%, transparent 68%), linear-gradient(0deg, transparent 48%, rgba(0,0,0,.25) 48%, rgba(0,0,0,.25) 52%, transparent 52%), linear-gradient(135deg, #f7d77c, #c9952b 60%, #f2cf6e)`,
        }}
      />
    </div>
  );
};

const IntroArt: React.FC<{f: number}> = ({f}) => {
  const [simAt, trayAt, chipAt, airAt] = T.intro;
  const simIn = sp(f, simAt, 16, 140);
  const tray = sp(f, trayAt, 18, 120);
  const trayOut = tw(f, chipAt, chipAt + 18, Easing.inOut(Easing.quad));
  const toChip = tw(f, chipAt + 6, chipAt + 30, Easing.inOut(Easing.cubic));
  const board = sp(f, chipAt + 14, 18, 140);
  const waves = f >= airAt ? (f - airAt) : -1;
  const cx = 540;
  const cy = 1050;
  const simW = mix(360, 150, toChip);
  return (
    <>
      {/* tray */}
      <div
        style={{
          position: 'absolute',
          left: cx - 330,
          top: cy - 150,
          width: 660,
          height: 300,
          borderRadius: 150,
          background: 'linear-gradient(180deg, #d5d7db, #8e9197)',
          boxShadow: '0 30px 60px rgba(0,0,0,.5)',
          opacity: Math.min(1, tray) * (1 - trayOut),
          transform: `translateX(${(1 - tray) * -600 - trayOut * 700}px)`,
        }}
      >
        <div style={{position: 'absolute', left: 40, top: 130, width: 40, height: 40, borderRadius: '50%', background: '#5d6066'}} />
      </div>
      {/* board + chip label */}
      <div
        style={{
          position: 'absolute',
          left: cx - 300,
          top: cy - 170,
          width: 600,
          height: 340,
          borderRadius: 44,
          background: '#0f3d2c',
          border: `2px solid ${ACCENT}`,
          backgroundImage: 'linear-gradient(rgba(48,209,88,.12) 2px, transparent 2px), linear-gradient(90deg, rgba(48,209,88,.12) 2px, transparent 2px)',
          backgroundSize: '40px 40px',
          opacity: Math.min(1, board),
          transform: `scale(${mix(0.85, 1, Math.min(1, board))})`,
        }}
      >
        <div style={{position: 'absolute', right: 30, bottom: 22, fontFamily: FONT, fontWeight: 700, fontSize: 40, color: ACCENT}}>eSIM</div>
      </div>
      {/* the SIM, which shrinks into the soldered chip */}
      <div style={{position: 'absolute', left: cx - simW / 2, top: cy - (simW * 0.68) / 2, opacity: Math.min(1, simIn), transform: `scale(${mix(0.6, 1, Math.min(1, simIn))}) rotate(${(1 - Math.min(1, simIn)) * -12}deg)`}}>
        <SimCard w={simW} />
      </div>
      {/* over-the-air waves */}
      {waves >= 0 &&
        [0, 1, 2].map((k) => {
          const p = ((waves / 26 + k / 3) % 1 + 1) % 1;
          const r = 120 + p * 380;
          return <div key={k} style={{position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `4px solid ${ACCENT}`, opacity: (1 - p) * tw(f, airAt, airAt + 10)}} />;
        })}
      {f >= airAt && (
        <div style={{position: 'absolute', left: 0, right: 0, top: cy + 260, display: 'flex', justifyContent: 'center'}}>
          <Pill p={sp(f, airAt + 12, 14, 220)} color={ACCENT} size={42}>
            Your number · Downloaded
          </Pill>
        </div>
      )}
    </>
  );
};

// ---------- iPhone screens ----------
const ListRow: React.FC<{label: string; detail?: string; on?: boolean; p?: number; color?: string}> = ({label, detail, on, p = 1, color = ACCENT}) => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 82, padding: '0 28px', borderTop: '1px solid #2c2c2e', fontFamily: FONT, fontSize: 32, color: '#fff', opacity: Math.min(1, p), transform: `translateX(${(1 - Math.min(1, p)) * 60}px)`}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
      <div style={{width: 18, height: 18, borderRadius: 9, background: on ? color : '#48484a'}} />
      {label}
    </div>
    <span style={{color: on ? color : C.grey, fontWeight: 600}}>{detail ?? (on ? 'On' : 'Off')}</span>
  </div>
);

const Screen: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
  <div style={{position: 'absolute', inset: 0, background: '#000', fontFamily: FONT}}>
    <div style={{position: 'absolute', left: 32, top: 130, fontSize: 58, fontWeight: 700, color: '#fff'}}>{title}</div>
    <div style={{position: 'absolute', left: 22, right: 22, top: 230}}>{children}</div>
    <StatusBar />
  </div>
);

const PhoneDemo: React.FC<{f: number}> = ({f}) => {
  if (f < T.cards[0] - 2 || f > T.spot + 4) return null;
  const enter = sp(f, T.cards[0], 18, 120);
  const exit = tw(f, T.spot - 10, T.spot + 2, Easing.in(Easing.cubic));
  const show = (i: number) => {
    const a = T.cards[i];
    const b = i < 3 ? T.cards[i + 1] : T.spot + 10;
    return tw(f, a - 4, a + 4) * (1 - (i < 3 ? tw(f, b - 4, b + 4) : 0));
  };
  const state = Math.max(0, Math.min(3, Math.floor((f - T.cards[0]) / 60)));
  const stored = ['Personal', 'Work', 'Travel · USA', 'Travel · Japan', 'Travel · Europe', 'Data only', 'Old number', 'Backup'];
  const travel = tw(f, T.cards[2] + 10, T.cards[2] + 40);
  return (
    <IPhone style={{left: (1080 - PHONE_W) / 2, top: 600, opacity: Math.min(1, enter * 1.4) * (1 - exit), transform: `translateY(${(1 - enter) * 700 + exit * 400}px) scale(${1 + hitEnv(f, T.cards[state], 8) * 0.015})`}}>
      {/* 1. two lines at once */}
      <div style={{position: 'absolute', inset: 0, opacity: show(0)}}>
        <Screen title="Cellular">
          <div style={{borderRadius: 28, background: '#1c1c1e', overflow: 'hidden'}}>
            <ListRow label="Personal" on p={sp(f, T.cards[0] + 8)} />
            <ListRow label="Work" on p={sp(f, T.cards[0] + 16)} />
          </div>
          <div style={{marginTop: 40, display: 'flex', gap: 16, opacity: tw(f, T.cards[0] + 24, T.cards[0] + 34)}}>
            {['Personal', 'Work'].map((n) => (
              <div key={n} style={{flex: 1, height: 170, borderRadius: 28, background: `color-mix(in srgb, ${ACCENT} 18%, #1c1c1e)`, border: `2px solid ${ACCENT}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10}}>
                <div style={{fontSize: 30, color: C.grey}}>{n}</div>
                <div style={{fontSize: 40, fontWeight: 700, color: '#fff'}}>Active</div>
              </div>
            ))}
          </div>
        </Screen>
      </div>
      {/* 2. 8+ stored */}
      <div style={{position: 'absolute', inset: 0, opacity: show(1)}}>
        <Screen title="eSIMs">
          <div style={{borderRadius: 28, background: '#1c1c1e', overflow: 'hidden'}}>
            {stored.map((n, i) => (
              <ListRow key={n} label={n} on={i < 2} detail={i < 2 ? 'Active' : 'Saved'} color={C.blue} p={sp(f, T.cards[1] + 4 + i * 4, 16, 200)} />
            ))}
          </div>
        </Screen>
      </div>
      {/* 3. travel plan */}
      <div style={{position: 'absolute', inset: 0, opacity: show(2), background: 'linear-gradient(170deg, #1b1f3b 0%, #3b1f5a 60%, #5a2a6e 100%)', fontFamily: FONT}}>
        <div style={{position: 'absolute', left: 32, top: 130, fontSize: 58, fontWeight: 700, color: '#fff'}}>Travel</div>
        <div style={{position: 'absolute', left: 22, right: 22, top: 250, borderRadius: 36, background: 'rgba(28,28,30,.92)', padding: 34}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 32, color: C.grey}}>
            <span>Travel data</span>
            <span style={{color: C.purple, fontWeight: 700}}>{travel > 0.5 ? 'Active' : 'Installing…'}</span>
          </div>
          <div style={{marginTop: 18, fontSize: 64, fontWeight: 700, color: '#fff'}}>10 GB</div>
          <div style={{marginTop: 22, height: 18, borderRadius: 9, background: '#2c2c2e'}}>
            <div style={{width: `${travel * 100}%`, height: '100%', borderRadius: 9, background: C.purple}} />
          </div>
          <div style={{marginTop: 22, fontSize: 28, color: C.grey}}>Set up at home. Works when you land.</div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 620, textAlign: 'center', fontSize: 120, opacity: 0.9, transform: `translateX(${mix(-260, 260, tw(f, T.cards[2], T.cards[3]))}px) rotate(0deg)`}}>✈︎</div>
        <StatusBar />
      </div>
      {/* 4. nothing to pull out */}
      <div style={{position: 'absolute', inset: 0, opacity: show(3), background: 'linear-gradient(170deg, #182848 0%, #3b1e54 60%, #6a2c47 100%)', fontFamily: FONT}}>
        <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontSize: 170, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em'}}>9:41</div>
        <div style={{position: 'absolute', left: 22, right: 22, top: 470, borderRadius: 40, background: 'rgba(30,30,34,.88)', padding: '30px 32px', opacity: Math.min(1, sp(f, T.cards[3] + 10, 16, 160)), transform: `translateY(${(1 - Math.min(1, sp(f, T.cards[3] + 10, 16, 160))) * -100}px)`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
            <div style={{width: 56, height: 56, borderRadius: 16, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#000', fontWeight: 700}}>✓</div>
            <div style={{fontSize: 32, fontWeight: 700, color: '#fff'}}>Line protected</div>
          </div>
          <div style={{marginTop: 14, fontSize: 28, lineHeight: 1.3, color: 'rgba(255,255,255,.8)'}}>Your number lives in the iPhone. There’s no card to remove or swap.</div>
        </div>
        <StatusBar />
      </div>
    </IPhone>
  );
};

export const ESim: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);

  const [simAt, trayAt, chipAt, airAt] = T.intro;
  const punch = HITS.reduce((a, [h, s]) => a + hitEnv(f, h, 9) * s * 0.035, 0);
  const shake = hitEnv(f, T.drop, 7) * 20 + hitEnv(f, T.final, 7) * 18 + hitEnv(f, T.drop + 4, 5) * 10;
  const impactZoom = 0.14 * hitEnv(f, T.drop, 10) + 0.12 * hitEnv(f, T.final, 10);
  const flash = Math.max(hitEnv(f, T.drop, 4), hitEnv(f, T.final, 4)) * 0.45;
  const sx = Math.sin(f * 2.7) * shake;
  const sy = Math.cos(f * 3.1) * shake * 0.8;
  const intro = f < T.drop;
  const introOut = tw(f, T.introOut, T.drop - 4);
  const tint =
    f < T.drop ? 'transparent' : f < T.cards[0] ? ACCENT : f < T.spot ? CARDS[Math.min(3, Math.floor((f - T.cards[0]) / 60))].color : f < T.fix[0] ? ACCENT : f < T.fix[3] ? C.blue : f < T.final ? C.orange : ACCENT;

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden', fontFamily: FONT}}>
      <Audio src={staticFile('kp/music-v3.wav')} />
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${1 + punch + impactZoom})`}}>
        {!intro && <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 45% at 50% 50%, color-mix(in srgb, ${tint} 22%, transparent), transparent 70%)`}} />}

        {/* ---------- 0-10s: minimal explanation ---------- */}
        {intro && (
          <AbsoluteFill style={{opacity: 1 - introOut, transform: `scale(${1 - introOut * 0.04})`}}>
            <Headline f={f} at={simAt} until={trayAt - 8} y={420}>
              A SIM card is a tiny chip
              <br />
              with your <span style={{color: ACCENT}}>number</span> on it.
            </Headline>
            <Headline f={f} at={trayAt} until={chipAt - 8} y={420}>
              For 30 years,
              <br />
              it lived in a tray.
            </Headline>
            <Headline f={f} at={chipAt} until={airAt - 8} y={420}>
              Now the chip
              <br />
              is built in…
            </Headline>
            <Headline f={f} at={airAt} until={T.introOut} y={420}>
              …and your number
              <br />
              arrives <span style={{color: ACCENT}}>over the air</span>.
            </Headline>
            <IntroArt f={f} />
          </AbsoluteFill>
        )}

        {/* ---------- 10s: the title ---------- */}
        <BigTitle f={f} at={T.drop} until={T.two[0] - 8} first="Meet" second="eSIM." firstSize={190} secondSize={240} color={ACCENT} />
        <Slam f={f} at={T.two[0]} until={T.cards[0] - 8} y={mix(920, 840, tw(f, T.two[1], T.two[1] + 10))} size={140} color={ACCENT}>
          No tray.
        </Slam>
        <Slam f={f} at={T.two[1]} until={T.cards[0] - 8} y={1000} size={140}>
          No swapping.
        </Slam>

        {/* ---------- 14-22s: what you get ---------- */}
        <Label f={f} at={T.cards[0]} until={T.spot - 8} y={250}>
          WHAT YOU GET
        </Label>
        {CARDS.map((c, i) => {
          const until = i < 3 ? T.cards[i + 1] - 4 : T.spot - 8;
          return (
            <React.Fragment key={c.title}>
              <Slam f={f} at={T.cards[i]} until={until} y={400} size={100} color={c.color}>
                {c.title}
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

        {/* ---------- 22-26s: iPhone 18 Pro ---------- */}
        <Label f={f} at={T.spot} until={T.fix[0] - 8} y={540} color={ACCENT}>
          IPHONE 18 PRO
        </Label>
        <Slam f={f} at={T.spot} until={T.fix[0] - 8} y={720} size={120}>
          {'eSIM-only in\n12 countries'}
        </Slam>
        {f >= T.parts[0] && f < T.fix[0] + 10 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: 1 - tw(f, T.fix[0] - 8, T.fix[0])}}>
            <Pill p={sp(f, T.parts[0], 14, 220)} color={ACCENT} size={42}>
              USA · Canada · Mexico · Japan · Gulf…
            </Pill>
            {f >= T.parts[1] && (
              <Pill p={sp(f, T.parts[1], 14, 220)} size={42}>
                Elsewhere: SIM tray + eSIM
              </Pill>
            )}
            {f >= T.parts[2] && (
              <Pill p={sp(f, T.parts[2], 14, 220)} color={C.yellow} size={42}>
                No tray = more room for battery
              </Pill>
            )}
          </div>
        )}

        {/* ---------- 26-32s: switching phones ---------- */}
        <Slam f={f} at={T.fix[0]} until={T.fix[1] - 6} y={860} size={150} color={C.blue}>
          {'Switching\nphones?'}
        </Slam>
        <Slam f={f} at={T.fix[0] + 5} until={T.fix[1] - 6} y={1110} size={150}>
          Transfer it.
        </Slam>
        <Slam f={f} at={T.fix[1]} until={T.fix[2] - 6} y={960} size={130}>
          {'Quick Transfer\nfrom your old\niPhone.'}
        </Slam>
        <Slam f={f} at={T.fix[2]} until={T.fix[3] - 6} y={960} size={130}>
          {'Or a QR code\nfrom your\ncarrier.'}
        </Slam>
        <Slam f={f} at={T.fix[3]} until={T.final - 8} y={700} size={120} color={C.orange}>
          {'Lost your\niPhone?'}
        </Slam>
        <Slam f={f} at={T.fix[4]} until={T.final - 8} y={1000} size={120}>
          {'Your carrier\ncan move it.'}
        </Slam>
        {f >= T.fix[5] && f < T.final + 8 && (
          <PillRow f={f} until={T.final - 8} y={1240}>
            <Pill p={sp(f, T.fix[5], 14, 220)} color={ACCENT} size={52}>
              No plastic needed
            </Pill>
          </PillRow>
        )}

        {/* ---------- 32s: final ---------- */}
        <BigTitle f={f} at={T.final} first="eSIM," second="explained." firstSize={190} secondSize={190} color={ACCENT} />
        <Signature f={f} at={T.final + 34} y={1300} />
      </AbsoluteFill>

      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(1 - tw(f, 0, 10), tw(f, T.end - 30, T.end))}} />
    </AbsoluteFill>
  );
};
