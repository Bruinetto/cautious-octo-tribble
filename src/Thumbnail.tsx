import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';

const FONT = "'DM Sans', sans-serif";
const CYAN = '#22d3ee';
const RED = '#ff3b3b';
const BLUE = '#2f6bff';

const Accent: React.FC<{color: string; children: React.ReactNode}> = ({color, children}) => (
  <span style={{color, textShadow: `0 0 0.35em ${color}aa`}}>{children}</span>
);

export const Thumbnail: React.FC = () => {
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
          9 – 11 OCTOBER
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
            fontSize: (vertical ? 5.2 : 5.6) * u,
            letterSpacing: '-0.01em',
          }}
        >
          10:00 AM <span style={{fontWeight: 500, opacity: 0.7, fontSize: '0.7em', letterSpacing: '0.2em'}}>NEW YORK</span>
          <span style={{opacity: 0.4}}>{'  ·  '}</span>
          16:00 <span style={{fontWeight: 500, opacity: 0.7, fontSize: '0.7em', letterSpacing: '0.2em'}}>ITALY</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
