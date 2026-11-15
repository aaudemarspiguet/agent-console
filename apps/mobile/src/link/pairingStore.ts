import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import type { Pairing } from '@deck/protocol';
import { parsePairing } from './client';

/**
 * Where the pairing is kept between launches (C-1). It holds the link's secret,
 * so on the phone it goes in the keychain through expo-secure-store.
 *
 * - **A build without expo-secure-store's native code** (every build before T15)
 *   keeps it in memory only: the phone pairs again at each launch. Loading the
 *   library there would throw, so this checks first.
 * - **On the web** (for testing) it is kept in localStorage, and a pairing can be
 *   passed in the address after `#`, as the T8 test screen allowed.
 */

const KEY = 'deck.pairing.v1';
let memory: string | null = null;

type SecureStore = typeof import('expo-secure-store');

function secureStore(): SecureStore | null {
  if (Platform.OS === 'web' || !requireOptionalNativeModule('ExpoSecureStore')) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-secure-store') as SecureStore;
}

/** Whether a saved pairing survives a relaunch on this build. */
export function pairingPersists(): boolean {
  return Platform.OS === 'web' || secureStore() !== null;
}

export async function loadPairing(): Promise<Pairing | null> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hash = window.location.hash.slice(1);
    const fromAddress = hash ? parsePairing(decodeURIComponent(hash)) : null;
    if (fromAddress) return fromAddress;
    try {
      const stored = window.localStorage.getItem(KEY);
      return stored ? parsePairing(stored) : null;
    } catch {
      return null;
    }
  }
  const store = secureStore();
  try {
    const stored = store ? await store.getItemAsync(KEY) : memory;
    return stored ? parsePairing(stored) : null;
  } catch (e) {
    console.log('pairing: could not read the keychain:', String(e));
    return null;
  }
}

export async function savePairing(pairing: Pairing): Promise<void> {
  const text = JSON.stringify(pairing);
  memory = text;
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(KEY, text);
    } catch {
      // Private window: kept for this page only.
    }
    return;
  }
  try {
    await secureStore()?.setItemAsync(KEY, text);
  } catch (e) {
    console.log('pairing: could not save to the keychain:', String(e));
  }
}
