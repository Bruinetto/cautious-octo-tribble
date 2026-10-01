import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/dm-sans/400-italic.css';
import '@fontsource/anton/400.css';
import {Composition, Still} from 'remotion';
import {DesignLanguage, DURATION} from './DesignLanguage';
import {OldVsNew, OLD_VS_NEW_DURATION} from './OldVsNew';
import {Promo, PROMO_DURATION} from './Promo';
import {Thumbnail} from './Thumbnail';
import {DuoAnnounce, DUO_DURATION} from './DuoAnnounce';
import {KernelPanic, KP_DURATION} from './KernelPanic';
import {KernelPanicEpic, KP_EPIC_DURATION} from './KernelPanicEpic';
import {KernelPanicV3, KP_V3_DURATION} from './KernelPanicV3';
import {ThermalThrottling, THERMAL_DURATION} from './ThermalThrottling';
import {ESim, ESIM_DURATION} from './ESim';

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
  <Composition id="DuoVertical" component={DuoAnnounce} durationInFrames={DUO_DURATION} fps={30} width={1080} height={1920} />
  <Composition id="DuoHorizontal" component={DuoAnnounce} durationInFrames={DUO_DURATION} fps={30} width={1920} height={1080} />
  <Composition id="KernelPanic" component={KernelPanic} durationInFrames={KP_DURATION} fps={30} width={1080} height={1920} />
  <Composition id="KernelPanicEpic" component={KernelPanicEpic} durationInFrames={KP_EPIC_DURATION} fps={30} width={1080} height={1920} />
  <Composition id="KernelPanicV3" component={KernelPanicV3} durationInFrames={KP_V3_DURATION} fps={30} width={1080} height={1920} />
  <Composition id="ThermalThrottling" component={ThermalThrottling} durationInFrames={THERMAL_DURATION} fps={30} width={1080} height={1920} />
  <Composition id="ESim" component={ESim} durationInFrames={ESIM_DURATION} fps={30} width={1080} height={1920} />
  </>
);
