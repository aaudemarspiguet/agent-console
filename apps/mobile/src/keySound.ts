import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { KeyClick } from '../modules/key-click';
import { KEY_SOUND_FILES, LEVELS_DB, type LevelDb } from './keySoundFiles';

/**
 * The key sound (K-4, handoff T11): a "creamy" press, smooth, cushioned, deep
 * and slightly thuddy, with a quieter sound as the key comes back.
 *
 * The user chose by ear on the phone (2026-11-13) from four recorded packs:
 * **Rainy 75**, a real recording of an aluminium, gasket-mounted keyboard, CC0,
 * taken from the Thock project's sound packs (source in
 * assets/sounds/LICENSES.md). It has six takes of press and release; a press
 * picks one at random, so the sound never repeats exactly.
 *
 * **iOS: like the keyboard's own clicks (the user, 2026-11-13).** The keys play
 * through System Sound Services (modules/key-click), which plays at the system
 * volume, as keyboard clicks do, rather than the media volume that expo-audio
 * uses. It has no volume control, so loudness is built into the files:
 * scripts/make-key-sounds.mjs writes each take at several levels, and the keys
 * use the level chosen by ear against the iPhone keyboard's click, and a quieter
 * one for a lighter press. Apple: only one system sound plays at a
 * time, so sounds cannot pile up during rapid presses.
 *
 * **Android and the web** use expo-audio, with each new sound fading out the
 * one before (fast typing smoothing, the user, 2026-11-13).
 */

/**
 * Loudness: LEVELS_DB[0] (28 dB below the recording) for a full press, chosen by
 * ear on the phone against the iPhone keyboard's own click (the user,
 * 2026-11-13): a little louder than the click, which the user preferred. A
 * lighter press plays the next level down (4 dB quieter), the lightest the one
 * after (8 dB quieter).
 */
function levelFor(strength: number): LevelDb {
  return LEVELS_DB[strength >= 0.8 ? 0 : strength >= 0.6 ? 1 : 2];
}

type Stroke = 'down' | 'up';
const TAKE_COUNT = KEY_SOUND_FILES[LEVELS_DB[0]].length;
const lastTake: Record<Stroke, number> = { down: -1, up: -1 };

/** A random take, not the one just played. */
function pickTake(stroke: Stroke, isReady: (take: number) => boolean = () => true): number {
  const ready = [...Array(TAKE_COUNT).keys()].filter((t) => t !== lastTake[stroke] && isReady(t));
  const take = ready.length > 0 ? ready[Math.floor(Math.random() * ready.length)] : (lastTake[stroke] + 1) % TAKE_COUNT;
  lastTake[stroke] = take;
  return take;
}

// ---------------------------------------------------------------- iOS

const systemKey = (db: LevelDb, take: number, stroke: Stroke) => `${db}/${take}/${stroke}`;
const loaded = new Set<string>();

/** Copies each file to a local path and registers it as a system sound. */
async function loadSystemSounds(): Promise<void> {
  if (!KeyClick) return;
  for (const db of LEVELS_DB) {
    for (let take = 0; take < TAKE_COUNT; take++) {
      for (const stroke of ['down', 'up'] as const) {
        try {
          const asset = await Asset.fromModule(KEY_SOUND_FILES[db][take][stroke]).downloadAsync();
          const key = systemKey(db, take, stroke);
          if (asset.localUri && KeyClick.load(key, asset.localUri)) loaded.add(key);
        } catch {
          // Leave this one out; the others still play.
        }
      }
    }
  }
}

function playSystem(stroke: Stroke, strength: number): void {
  const db = levelFor(strength);
  const take = pickTake(stroke, (t) => loaded.has(systemKey(db, t, stroke)));
  KeyClick?.play(systemKey(db, take, stroke));
}

// ---------------------------------------------------- Android and the web

/**
 * One expo-audio player per take, made when the app starts. A player that has
 * finished is rewound straight away, so a press only calls `play()`.
 */
interface Voice {
  player: AudioPlayer;
  /** Playing, fading out, or rewinding after it stopped. */
  busy: boolean;
  /** Counts plays, so a late fade or rewind from an earlier play does nothing. */
  play: number;
}

/** Voices whose sound may still be heard. */
const sounding = new Set<Voice>();

function rewind(voice: Voice, play: number): void {
  sounding.delete(voice);
  voice.player
    .seekTo(0)
    .catch(() => {})
    .finally(() => {
      if (voice.play === play) voice.busy = false;
    });
}

function makeVoice(source: number): Voice {
  const voice: Voice = { player: createAudioPlayer(source), busy: false, play: 0 };
  voice.player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) rewind(voice, voice.play);
  });
  return voice;
}

/** Fast typing smoothing: fade out what is still ringing over FADE_MS. */
const FADE_MS = 24;
const FADE_STEPS = [0.55, 0.25, 0.08];

function fadeOut(voice: Voice): void {
  const play = voice.play;
  const from = voice.player.volume;
  FADE_STEPS.forEach((level, i) => {
    setTimeout(() => {
      if (voice.play === play) voice.player.volume = from * level;
    }, (FADE_MS / FADE_STEPS.length) * i);
  });
  setTimeout(() => {
    if (voice.play !== play) return;
    voice.player.pause();
    rewind(voice, play);
  }, FADE_MS);
}

let voices: Record<Stroke, Voice[]> | null = null;

function playAudio(stroke: Stroke, strength: number): void {
  if (!voices) return;
  const db = levelFor(strength);
  const pool = voices[stroke];
  const take = pickTake(stroke, (t) => !pool[t].busy);
  const voice = pool[take];
  if (voice.busy) void voice.player.seekTo(0).catch(() => {});
  voice.play += 1;
  sounding.delete(voice);
  for (const other of sounding) fadeOut(other);
  sounding.clear();
  voice.busy = true;
  voice.player.volume = 10 ** (-(db - LEVELS_DB[0]) / 20);
  voice.player.play();
  sounding.add(voice);
}

// ------------------------------------------------------------------ setup

if (KeyClick) {
  void loadSystemSounds();
} else {
  // Ambient: silenced by the Silent switch, and mixed with other apps' audio.
  void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  voices = {
    down: KEY_SOUND_FILES[LEVELS_DB[0]].map((t) => makeVoice(t.down)),
    up: KEY_SOUND_FILES[LEVELS_DB[0]].map((t) => makeVoice(t.up)),
  };
}

const playKey = Platform.OS === 'ios' && KeyClick ? playSystem : playAudio;

/** The bottom-out sound. `strength` runs from 0.45 (light) to 1 (full). */
export function soundDown(strength: number): void {
  playKey('down', strength);
}

/** The return sound. `strength` runs from 0.45 (light) to 1 (full). */
export function soundUp(strength: number): void {
  playKey('up', strength);
}
