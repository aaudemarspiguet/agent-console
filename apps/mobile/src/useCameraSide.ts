import { useEffect, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

export type Side = 'left' | 'right';

/**
 * Which edge of the landscape screen the front camera is on. The island sits on
 * that edge so it joins the phone's own camera cutout (K-8).
 *
 * iOS has no API for where the cutout is, so this comes from the interface
 * orientation: in "landscape right" the top of the phone, and the camera with it,
 * is on the left.
 */
export function useCameraSide(): Side {
  const [side, setSide] = useState<Side>('left');

  useEffect(() => {
    let mounted = true;
    const apply = (orientation: ScreenOrientation.Orientation) => {
      if (!mounted) return;
      if (orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT) setSide('left');
      if (orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT) setSide('right');
    };

    // If the orientation cannot be read (the web, for one), keep the default side.
    ScreenOrientation.getOrientationAsync().then(apply).catch(() => {});
    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      apply(event.orientationInfo.orientation);
    });

    return () => {
      mounted = false;
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  return side;
}
