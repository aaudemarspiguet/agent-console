import { Platform } from 'react-native';
import { requireNativeModule } from 'expo';

/** The iOS-only native module in ios/KeyClickModule.swift. */
interface KeyClickNative {
  load(key: string, url: string): boolean;
  play(key: string): void;
}

/** Present on iOS only; elsewhere the key sounds use expo-audio. */
export const KeyClick: KeyClickNative | null = Platform.OS === 'ios' ? requireNativeModule<KeyClickNative>('KeyClick') : null;
