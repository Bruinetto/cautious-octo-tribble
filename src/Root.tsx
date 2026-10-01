import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/dm-sans/400-italic.css';
import {Composition, Still} from 'remotion';
import {DesignLanguage, DURATION} from './DesignLanguage';
import {OldVsNew, OLD_VS_NEW_DURATION} from './OldVsNew';
import {Promo, PROMO_DURATION} from './Promo';
import {Thumbnail} from './Thumbnail';

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
  <Composition id="PromoVertical" component={Promo} durationInFrames={PROMO_DURATION} fps={30} width={1080} height={1920} />
  <Composition id="PromoHorizontal" component={Promo} durationInFrames={PROMO_DURATION} fps={30} width={1920} height={1080} />
  <Still id="ThumbnailHorizontal" component={Thumbnail} width={1280} height={720} />
  <Still id="ThumbnailVertical" component={Thumbnail} width={1080} height={1920} />
  </>
);
