import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/dm-sans/400-italic.css';
import {Composition} from 'remotion';
import {DesignLanguage, DURATION} from './DesignLanguage';
import {OldVsNew, OLD_VS_NEW_DURATION} from './OldVsNew';

export const Root = () => (
  <>
  <Composition
    id="DesignLanguage"
    component={DesignLanguage}
    durationInFrames={DURATION}
    fps={30}
    width={1080}
    height={1080}
  />
  <Composition
    id="OldVsNew"
    component={OldVsNew}
    durationInFrames={OLD_VS_NEW_DURATION}
    fps={30}
    width={1080}
    height={1080}
  />
  </>
);
