import React from 'react';
import {Img, interpolate, spring, staticFile} from 'remotion';

const dm = {fontFamily: "'DM Sans', 'Liberation Sans', Arial, sans-serif"};
const dmItalic = dm;
const rubik = {fontFamily: "Rubik, 'Liberation Sans', Arial, sans-serif"};

export const FPS = 30;
const sp = (f: number, delay = 0, damping = 14) =>
  spring({frame: f - delay, fps: FPS, config: {damping, stiffness: 110, mass: 0.9}});


/** OLD: black background, heavy headline over the phone */
export const OldPost: React.FC<{f: number}> = ({f}) => {
  const lines = ['APPLE', 'ANNOUNCES', 'iPhone 18 Pro', 'AND      Pro Max'];
  const phone = sp(f, 4);
  return (
    <div style={{position: 'absolute', inset: 0, background: '#000', overflow: 'hidden'}}>
      <Img
        src={staticFile('phone-black.png')}
        style={{
          position: 'absolute',
          left: 311,
          top: 327 + (1 - phone) * 420,
          width: 475,
          opacity: interpolate(f, [0, 14], [0, 1], {extrapolateRight: 'clamp'}),
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 34,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: rubik.fontFamily,
          fontWeight: 900,
          color: '#fff',
          fontSize: 132,
          lineHeight: 0.92,
          letterSpacing: -2,
          whiteSpace: 'pre',
        }}
      >
        {lines.map((l, i) => {
          const p = sp(f, 6 + i * 5, 16);
          return (
            <div key={l} style={{overflow: 'hidden', height: 122}}>
              <div style={{transform: `translateY(${(1 - p) * 130}px)`}}>{l}</div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 520,
          color: '#fff',
          fontFamily: dm.fontFamily,
          fontSize: 34,
          opacity: interpolate(f, [30, 42], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}
      >
        What’s new?
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 52,
          left: '50%',
          transform: `translateX(-50%) scale(${sp(f, 26)})`,
          padding: '26px 58px',
          borderRadius: 999,
          background: 'rgba(85,50,58,0.75)',
          color: '#fff',
          fontFamily: dmItalic.fontFamily,
          fontStyle: 'italic',
          fontSize: 44,
        }}
      >
        fantexinsta
      </div>
    </div>
  );
};

/** CANDIDATE: light background, tile + salmon pill */
export const CandidatePost: React.FC<{f: number}> = ({f}) => {
  const tile = sp(f, 2);
  const title = sp(f, 12, 18);
  const pill = sp(f, 24, 10);
  return (
    <div style={{position: 'absolute', inset: 0, background: '#f2f2f2', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          top: 92,
          width: '100%',
          textAlign: 'center',
          fontFamily: dm.fontFamily,
          fontWeight: 500,
          fontSize: 100,
          color: '#0b0b0b',
          letterSpacing: -2,
          transform: `translateY(${(1 - title) * -50}px)`,
          opacity: title,
        }}
      >
        iPhone 18 Pro
      </div>
      <Img
        src={staticFile('tile-light.png')}
        style={{
          position: 'absolute',
          left: 231,
          top: 231,
          width: 617,
          transform: `scale(${0.6 + tile * 0.4})`,
          opacity: tile,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 62,
          left: '50%',
          transform: `translateX(-50%) scale(${pill})`,
          padding: '22px 52px',
          borderRadius: 999,
          background: '#f4b39a',
          color: '#1a1a1a',
          fontFamily: dmItalic.fontFamily,
          fontStyle: 'italic',
          fontSize: 44,
        }}
      >
        fantexinsta
      </div>
    </div>
  );
};

/** NEW: combined language, plum background */
export const NewPost: React.FC<{f: number}> = ({f}) => {
  const tile = sp(f, 2, 12);
  const title = sp(f, 10, 18);
  const handle = interpolate(f, [22, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const float = Math.sin(f / 18) * 6;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: 'radial-gradient(ellipse 60% 30% at 50% 100%, #b1777d 0%, #a1656d 70%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 92,
          width: '100%',
          textAlign: 'center',
          fontFamily: dm.fontFamily,
          fontWeight: 400,
          fontSize: 100,
          color: '#fff',
          letterSpacing: -2,
          opacity: title,
          filter: `blur(${(1 - title) * 12}px)`,
          transform: `translateY(${(1 - title) * 30}px)`,
        }}
      >
        iPhone 18 Pro
      </div>
      <Img
        src={staticFile('tile-purple.png')}
        style={{
          position: 'absolute',
          left: 231,
          top: 231 + float,
          width: 617,
          transform: `scale(${0.75 + tile * 0.25})`,
          opacity: tile,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 78,
          width: '100%',
          textAlign: 'center',
          fontFamily: dmItalic.fontFamily,
          fontStyle: 'italic',
          fontSize: 46,
          color: '#fff',
          opacity: handle,
          transform: `translateY(${(1 - handle) * 20}px)`,
        }}
      >
        fantexinsta
      </div>
    </div>
  );
};
