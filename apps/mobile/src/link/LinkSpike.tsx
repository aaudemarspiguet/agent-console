import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { Pairing } from '@deck/protocol';
import { parsePairing, useLink } from './useLink';

/**
 * Test screen for the Gate 0 connection spike (handoff T8; brief G0-1 to G0-3).
 * Not the product's look: plain buttons, so the link can be tried before the deck's
 * keys are wired to it. Shown when SCREEN is 'link' in App.tsx.
 *
 * The deny reason and the follow-up are fixed texts, because the deck has no
 * on-screen keyboard and voice needs a development build.
 */

const DENY_REASON = 'Denied from the phone. Do not run that; list the files with dir instead.';
const FOLLOWUP = 'Follow-up from the phone: reply with exactly FOLLOW-UP RECEIVED and nothing else.';

/** On the web, a pairing can be passed in the address after #, for testing without a camera. */
function pairingFromAddress(): Pairing | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const hash = window.location.hash.slice(1);
  return hash ? parsePairing(decodeURIComponent(hash)) : null;
}

export function LinkSpike() {
  const [pairing, setPairing] = useState<Pairing | null>(pairingFromAddress);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const link = useLink(pairing);
  const current = link.requests[0];
  const lastSession = current?.sessionId ?? link.lastSessionId;

  const startScan = async () => {
    if (!permission?.granted) {
      // A failed permission request must not raise an unhandled rejection.
      const result = await requestPermission().catch(() => null);
      if (!result?.granted) return;
    }
    setScanning(true);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.left}>
        <Text style={styles.title}>Link test (T8)</Text>
        <Text style={styles.state}>
          {link.state}
          {link.state === 'linked' ? ` · ${link.pcName}` : ''}
        </Text>
        {scanning ? (
          <View style={styles.camera}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => {
                const p = parsePairing(data);
                if (p) {
                  setScanning(false);
                  setPairing(p);
                }
              }}
            />
          </View>
        ) : (
          <Button label={pairing ? 'Scan again' : 'Scan PC code'} onPress={startScan} />
        )}
        {scanning && <Button label="Cancel scan" onPress={() => setScanning(false)} />}
        <ScrollView style={styles.events}>
          {link.events.map((e) => (
            <Text key={`${e.at}-${e.text}`} style={styles.event}>
              {new Date(e.at).toLocaleTimeString()} {e.text}
            </Text>
          ))}
        </ScrollView>
      </View>

      <View style={styles.right}>
        {current ? (
          <>
            <Text style={styles.label}>
              {current.tool} · {current.cwd.split(/[\\/]/).pop()}
              {link.requests.length > 1 ? ` · ${link.requests.length - 1} more waiting` : ''}
            </Text>
            <Text style={styles.summary} numberOfLines={4}>
              {current.summary}
            </Text>
            <View style={styles.row}>
              <Button label="Deny" onPress={() => link.answer(current.id, 'deny')} />
              <Button label="Deny with reason" onPress={() => link.answer(current.id, 'deny', DENY_REASON)} />
              <Button label="Allow" primary onPress={() => link.answer(current.id, 'allow')} />
            </View>
          </>
        ) : (
          <Text style={styles.label}>No request waiting.</Text>
        )}
        <View style={styles.row}>
          <Button
            label="Queue follow-up"
            disabled={!lastSession || link.state !== 'linked'}
            onPress={() => lastSession && link.queueFollowup(lastSession, FOLLOWUP)}
          />
        </View>
        <Text style={styles.hint}>The follow-up goes to the last session that asked, when its turn ends.</Text>
      </View>
    </View>
  );
}

function Button({
  label,
  onPress,
  primary,
  disabled,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        primary && styles.primary,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, flexDirection: 'row', backgroundColor: '#111', paddingHorizontal: 70, paddingVertical: 16, gap: 20 },
  left: { flex: 1, gap: 10 },
  right: { flex: 1.3, gap: 12, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 17, fontWeight: '600' },
  state: { color: '#8ad', fontSize: 15 },
  camera: { height: 150, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' },
  events: { flex: 1, backgroundColor: '#000', borderRadius: 8, padding: 8 },
  event: { color: '#aaa', fontSize: 11, marginBottom: 3 },
  label: { color: '#aaa', fontSize: 13 },
  summary: { color: '#fff', fontSize: 16, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  hint: { color: '#666', fontSize: 11 },
  button: { backgroundColor: '#2c2c2f', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
  primary: { backgroundColor: '#1a88f7' },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 14 },
});
