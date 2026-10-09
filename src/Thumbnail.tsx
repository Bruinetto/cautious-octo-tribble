import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';

const FONT = "'DM Sans', sans-serif";
const CYAN = '#22d3ee';
const RED = '#ff3b3b';
const BLUE = '#2f6bff';

// Same instant as 10:00 AM New York (EDT) on 9–11 Oct 2026
const OTHER_TIMES = [
  {time: '16:00', city: 'ITALY'},
  {time: '15:00', city: 'LONDON'},
  {time: '7:00 AM', city: 'LOS ANGELES'},
  {time: '23:00', city: 'TOKYO'},
];

const Accent: React.FC<{color: string; children: React.ReactNode}> = ({color, children}) => (
  <span style={{color, textShadow: `0 0 0.35em ${color}aa`}}>{children}</span>
);

export const Thumbnail: React.FC<{dates?: string}> = ({dates = '9 – 11 OCTOBER'}) => {
  const {width, height} = useVideoConfig();
  const vertical = height > width;
  const u = Math.min(width, height) / 100; // 1% of the short side

  const lines: {node: React.ReactNode; color: string}[] = [
    {node: <>barcly <Accent color={CYAN}>2.0</Accent></>, color: CYAN},
    {node: <>minitravels <Accent color={RED}>2.0</Accent></>, color: RED},
    {node: <>One more <Accent color={BLUE}>thing</Accent></>, color: BLUE},
  ];

  return (
    <AbsoluteFill style={{background: '#000', fontFamily: FONT, color: '#fff', overflow: 'hidden'}}>
      {/* three colour glows rising from the bottom */}
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(ellipse 48% 70% at 12% 108%, ${CYAN} 0%, ${CYAN}55 40%, transparent 75%)`,
            `radial-gradient(ellipse 48% 70% at 50% 108%, ${RED} 0%, ${RED}55 40%, transparent 75%)`,
            `radial-gradient(ellipse 48% 70% at 88% 108%, ${BLUE} 0%, ${BLUE}55 40%, transparent 75%)`,
          ].join(', '),
          opacity: 0.95,
        }}
      />
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, #000 0%, rgba(0,0,0,.55) 30%, transparent 58%)'}} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: vertical ? 'center' : 'flex-start',
          textAlign: vertical ? 'center' : 'left',
          padding: vertical ? `0 ${6 * u}px ${30 * u}px` : `0 ${11 * u}px ${8 * u}px`,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: (vertical ? 4.2 : 4.4) * u,
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,.75)',
            marginBottom: 4 * u,
          }}
        >
          {dates}
        </div>
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              fontWeight: 700,
              fontSize: (vertical ? 11.5 : 16) * u,
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
              whiteSpace: 'nowrap',
            }}
          >
            {l.node}
          </div>
        ))}
        <div
          style={{
            marginTop: 5 * u,
            fontWeight: 700,
            fontSize: (vertical ? 5.6 : 6) * u,
            letterSpacing: '-0.01em',
          }}
        >
          10:00 AM <span style={{fontWeight: 500, opacity: 0.7, fontSize: '0.7em', letterSpacing: '0.2em'}}>NEW YORK</span>
        </div>
        <div
          style={{
            marginTop: 1.6 * u,
            fontWeight: 500,
            fontSize: (vertical ? 2.9 : 2.9) * u,
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,.6)',
            whiteSpace: 'pre',
            display: vertical ? 'grid' : 'block',
            gridTemplateColumns: '1fr 1fr',
            rowGap: 1.2 * u,
            columnGap: 5 * u,
          }}
        >
          {OTHER_TIMES.map((z, i) => (
            <span key={z.city}>
              {i > 0 && !vertical && <span style={{opacity: 0.5}}>{'   ·   '}</span>}
              <span style={{fontWeight: 700, color: 'rgba(255,255,255,.85)'}}>{z.time}</span> {z.city}
            </span>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
