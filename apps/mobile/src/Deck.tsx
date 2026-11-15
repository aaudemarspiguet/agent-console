import { useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { KeyId } from '@deck/protocol';
import { EffortWheel, WHEEL_COLUMN_WIDTH } from './EffortWheel';
import { Key } from './Key';
import { COLUMNS, DEFAULT_KEYS, ROWS } from './layout';
import { StatusStrip } from './PlateParts';
import { useCameraSide } from './useCameraSide';
import { EFFORT_LEVELS } from './island/demo';
import { CUTOUT_WIDTH, Island, KEYS_START, useReduceMotion } from './island/Island';
import { island, useIsland } from './island/store';
import { SCENE_VIEW } from './island/scenes';

const GAP = 9;
/** Room kept at the wheel's end of the plate, and the least kept at the camera's end. */
const END_MARGIN = 62;
/** Distance of the effort wheel's centre from the screen edge (as in the mockups: 11 + 40 / 2). */
const WHEEL_CENTRE_INSET = 31;
/** Where the screen sits on a phone with no camera cutout. */
const SCREEN_FALLBACK_INSET = 8;

/**
 * Distance of the screen from the camera edge: the cutout's own distance, so
 * the screen's black margin covers it. iOS does not report where the cutout
 * is, but it sits near the middle of the safe-area inset on that edge (about 1
 * point further in; measured in T1 and confirmed on the phone in T4).
 */
function screenInset(cameraEdgeInset: number): number {
  if (cameraEdgeInset < CUTOUT_WIDTH) return SCREEN_FALLBACK_INSET;
  return cameraEdgeInset / 2 + 1 - CUTOUT_WIDTH / 2;
}

interface DeckProps {
  onKeyPress: (id: KeyId) => void;
}

/**
 * The plate: status strip, key grid, island and effort wheel. Nothing is
 * connected yet, so the island runs on the demo sessions in `island/demo.ts`
 * (temporary, T13): a long press on the Link light makes the next demo event.
 */
export function Deck({ onKeyPress }: DeckProps) {
  // On the web, `?scene=` swaps in the phone's insets and camera side (scenes.ts).
  const safeInsets = useSafeAreaInsets();
  const phoneSide = useCameraSide();
  const insets = SCENE_VIEW?.insets ?? safeInsets;
  const cameraSide = SCENE_VIEW?.side ?? phoneSide;
  const wheelSide = cameraSide === 'left' ? 'right' : 'left';
  const s = useIsland();
  const reduceMotion = useReduceMotion();
  const still = reduceMotion || !!SCENE_VIEW;
  const lights = island.lights();
  // The plate fills the window. (A Pressable's onLayout never fired on the web.)
  const plate = useWindowDimensions();
  const plateWidth = plate.width;
  const [gridHeight, setGridHeight] = useState(0);

  // The key area starts 348 points from the camera edge, beside the screen, and
  // stays there: the screen is fixed open (the user, 2026-11-14), so the keys
  // no longer slide.
  const cameraPad = Math.max(KEYS_START, insets[cameraSide]);
  const wheelPad = Math.max(insets[wheelSide], END_MARGIN);
  const gridWidth = plateWidth - cameraPad - wheelPad;
  const cellWidth = (gridWidth - GAP * (COLUMNS - 1)) / COLUMNS;
  const cellHeight = (gridHeight - GAP * (ROWS - 1)) / ROWS;

  const onGridLayout = (event: LayoutChangeEvent) => setGridHeight(event.nativeEvent.layout.height);

  const press = (id: KeyId) => {
    island.pressKey(id);
    onKeyPress(id);
  };

  return (
    <Pressable
      // A tap on the plate outside the keys leaves a session view (K-5).
      onPress={island.tapOutside}
      accessible={false}
      style={[
        styles.plate,
        {
          [`padding${cameraSide === 'left' ? 'Left' : 'Right'}`]: cameraPad,
          [`padding${wheelSide === 'left' ? 'Left' : 'Right'}`]: wheelPad,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 21),
        },
      ]}
    >
      <View style={styles.grain} pointerEvents="none" />
      <Island s={s} side={cameraSide} inset={screenInset(insets[cameraSide])} plateHeight={plate.height} still={still} />
      <View style={[styles.edge, { [wheelSide]: WHEEL_CENTRE_INSET - WHEEL_COLUMN_WIDTH / 2 }]}>
        <EffortWheel
          active={island.wheelActive()}
          level={island.wheelLevel()}
          levels={EFFORT_LEVELS.length}
          onTurn={island.wheelTurn}
          onStop={island.wheelStop}
        />
      </View>

      <View style={styles.column}>
        <StatusStrip linked={lights.linked} requestWaiting={lights.requestWaiting} onLinkLongPress={island.demoNext} />
        <View style={styles.grid} onLayout={onGridLayout}>
          {plateWidth > 0 && gridHeight > 0 &&
            DEFAULT_KEYS.map((key) => {
              const wide = key.wide ?? 1;
              const high = key.high ?? 1;
              return (
                <Key
                  key={key.id}
                  def={key}
                  left={key.column * (cellWidth + GAP)}
                  top={key.row * (cellHeight + GAP)}
                  width={cellWidth * wide + GAP * (wide - 1)}
                  height={cellHeight * high + GAP * (high - 1)}
                  light={lights.sessions[key.id]}
                  unlit={lights.unlit.includes(key.id)}
                  onPress={press}
                  onDown={key.id === 'redirect' ? island.redirectDown : undefined}
                  onUp={key.id === 'redirect' ? island.redirectUp : undefined}
                />
              );
            })}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  plate: {
    flex: 1,
    backgroundColor: '#232326',
    backgroundImage: 'linear-gradient(180deg, #2C2C30, #19191B)',
  },
  column: {
    flex: 1,
    gap: GAP,
  },
  /** Holds the wheel against one screen edge, centred top to bottom. */
  edge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  grid: {
    flex: 1,
  },
  /**
   * The plate's fine horizontal grain: a 1-point light line every 3 points, as
   * the mockup's repeating gradient. React Native documents only linear and
   * radial gradients, so one hard-edged line is drawn and tiled.
   */
  grain: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.028) 1px, rgba(255,255,255,0) 1px)',
    backgroundSize: '100% 3px',
    backgroundRepeat: 'repeat',
  },
});
