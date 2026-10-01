/**
 * A realistic, logo-free iPhone drawn in CSS: titanium frame, side buttons,
 * Dynamic Island, status bar and glass glare. The screen content is passed in.
 */
import React from 'react';
import {FONT} from './explained';

export const PHONE_W = 520;
export const PHONE_H = 1060;

export const SignalBars: React.FC<{bars: number; size?: number; color?: string; dim?: string}> = ({bars, size = 26, color = '#fff', dim = 'rgba(255,255,255,.28)'}) => (
  <div style={{display: 'flex', alignItems: 'flex-end', gap: size * 0.14, height: size}}>
    {[0.35, 0.55, 0.78, 1].map((h, i) => (
      <div key={i} style={{width: size * 0.2, height: size * h, borderRadius: size * 0.06, background: i < bars ? color : dim}} />
    ))}
  </div>
);

export const Battery: React.FC<{level: number; charging?: boolean; color?: string}> = ({level, charging, color = '#fff'}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 3}}>
    <div style={{position: 'relative', width: 50, height: 24, borderRadius: 7, border: '2.5px solid rgba(255,255,255,.45)', padding: 2, boxSizing: 'border-box'}}>
      <div style={{width: `${level * 100}%`, height: '100%', borderRadius: 4, background: color}} />
      {charging && <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#000', fontWeight: 700}}>⚡</div>}
    </div>
    <div style={{width: 3, height: 9, borderRadius: 2, background: 'rgba(255,255,255,.45)'}} />
  </div>
);

export const StatusBar: React.FC<{bars?: number; battery?: number; charging?: boolean; batteryColor?: string; barsColor?: string}> = ({
  bars = 4,
  battery = 0.8,
  charging,
  batteryColor,
  barsColor,
}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 30, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 46px', fontFamily: FONT, fontWeight: 600, fontSize: 32, color: '#fff', zIndex: 5}}>
    <span>9:41</span>
    <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
      <SignalBars bars={bars} size={24} color={barsColor} />
      <Battery level={battery} charging={charging} color={batteryColor} />
    </div>
  </div>
);

export const IPhone: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', width: PHONE_W, height: PHONE_H, ...style}}>
    {/* side buttons */}
    {[
      {side: 'left', top: 200, h: 56},
      {side: 'left', top: 290, h: 96},
      {side: 'left', top: 400, h: 96},
      {side: 'right', top: 320, h: 150},
    ].map((b, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          [b.side]: -7,
          top: b.top,
          width: 9,
          height: b.h,
          borderRadius: 4,
          background: 'linear-gradient(90deg, #5d6066, #b9bcc2, #6b6e74)',
        }}
      />
    ))}
    {/* titanium frame */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 96,
        background: 'linear-gradient(135deg, #9a9da3 0%, #e3e5e8 18%, #7a7d83 40%, #c9cbcf 62%, #6f7278 82%, #b4b7bc 100%)',
        boxShadow: '0 60px 120px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.08)',
      }}
    />
    {/* black bezel + screen */}
    <div style={{position: 'absolute', inset: 9, borderRadius: 88, background: '#050505'}} />
    <div style={{position: 'absolute', inset: 22, borderRadius: 76, overflow: 'hidden', background: '#000'}}>
      {children}
      {/* Dynamic Island */}
      <div style={{position: 'absolute', top: 24, left: '50%', width: 150, height: 44, marginLeft: -75, borderRadius: 22, background: '#000', zIndex: 6}} />
      {/* glass glare */}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(125deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 70%, rgba(255,255,255,.05) 100%)', zIndex: 7}} />
    </div>
  </div>
);

/** Generic home-screen grid (plain rounded tiles, no real app icons) */
export const HomeGrid: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(165deg, #1d3c78 0%, #5a2d82 55%, #b04a6b 100%)'}}>
    <div style={{position: 'absolute', left: 40, right: 40, top: 130, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '34px 30px'}}>
      {Array.from({length: 20}, (_, i) => (
        <div key={i} style={{aspectRatio: '1', borderRadius: 22, background: `hsl(${(i * 53 + 10) % 360} 60% 58%)`, boxShadow: 'inset 0 -6px 12px rgba(0,0,0,.15)'}} />
      ))}
    </div>
    <div style={{position: 'absolute', left: 28, right: 28, bottom: 28, height: 130, borderRadius: 50, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 24px'}}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{width: 84, height: 84, borderRadius: 22, background: `hsl(${(i * 90 + 200) % 360} 55% 55%)`}} />
      ))}
    </div>
  </div>
);
