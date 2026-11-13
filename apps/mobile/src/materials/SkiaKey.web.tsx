import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import type { Light } from './shared';

/**
 * On the web Skia runs from CanvasKit (WebAssembly), which has to load before
 * any Skia component is imported. `canvaskit.wasm` is copied into `public/` by
 * `pnpm --filter mobile setup-skia-web`.
 */
export function SkiaKey({ light }: { light: Light }) {
  return (
    <WithSkiaWeb
      opts={{ locateFile: (file: string) => `/${file}` }}
      getComponent={() => import('./SkiaKeyBody')}
      componentProps={{ light }}
    />
  );
}
