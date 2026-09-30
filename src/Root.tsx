import {Composition} from 'remotion';
import {DesignLanguage, DURATION} from './DesignLanguage';

export const Root = () => (
  <Composition
    id="DesignLanguage"
    component={DesignLanguage}
    durationInFrames={DURATION}
    fps={30}
    width={1080}
    height={1080}
  />
);
