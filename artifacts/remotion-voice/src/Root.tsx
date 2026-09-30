import {Composition, staticFile} from 'remotion';
import {Dictation} from './Dictation';
import {makePlan, type Timeline} from './plan';

const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Dictation"
    component={Dictation}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={FPS * 24}
    defaultProps={{timeline: null as Timeline | null}}
    // the composition is as long as the real voice-over
    calculateMetadata={async () => {
      const res = await fetch(staticFile('voice/timeline.json'));
      const timeline = (await res.json()) as Timeline;
      return {durationInFrames: Math.ceil(makePlan(timeline).duration * FPS), props: {timeline}};
    }}
  />
);
