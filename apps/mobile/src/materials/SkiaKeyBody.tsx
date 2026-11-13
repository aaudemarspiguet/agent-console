import {
  BackdropBlur,
  BlurMask,
  Canvas,
  LinearGradient,
  Oval,
  RoundedRect,
  rect,
  rrect,
  vec,
} from '@shopify/react-native-skia';
import { CAP, type Light, WELL_HEIGHT, WELL_WIDTH } from './shared';

/**
 * TEMPORARY (handoff task T5). The lit key drawn with React Native Skia: the
 * glow is a real 14-point Gaussian blur, and the cap blurs what is under it,
 * as the mockup's backdrop-filter does.
 */
export default function SkiaKeyBody({ light }: { light: Light }) {
  const capRect = rrect(rect(CAP.x, CAP.y, CAP.width, CAP.height), CAP.radius, CAP.radius);
  return (
    <Canvas style={{ position: 'absolute', left: 0, top: 0, width: WELL_WIDTH, height: WELL_HEIGHT }}>
      <Oval
        x={WELL_WIDTH * 0.2}
        y={WELL_HEIGHT * 0.32}
        width={WELL_WIDTH * 0.6}
        height={WELL_HEIGHT * 0.52}
        color={`rgba(${light.color},${light.strength})`}
      >
        <BlurMask blur={14} style="normal" />
      </Oval>
      <BackdropBlur blur={14} clip={capRect}>
        <RoundedRect x={CAP.x} y={CAP.y} width={CAP.width} height={CAP.height} r={CAP.radius}>
          <LinearGradient
            start={vec(0, CAP.y)}
            end={vec(0, CAP.y + CAP.height)}
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
          />
        </RoundedRect>
      </BackdropBlur>
      <RoundedRect
        x={CAP.x + 0.5}
        y={CAP.y + 0.5}
        width={CAP.width - 1}
        height={CAP.height - 1}
        r={CAP.radius - 0.5}
        style="stroke"
        strokeWidth={1}
        color="rgba(255,255,255,0.15)"
      />
    </Canvas>
  );
}
