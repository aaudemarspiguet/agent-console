import { useCallback, useEffect, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import {
  PROTOCOL_VERSION,
  SecureChannel,
  fromBase64,
  sessionKey,
  toBase64,
  type AgentMessage,
  type HelloFromAgent,
  type HelloFromPhone,
  type Pairing,
  type PermissionRequest,
  type PhoneMessage,
} from '@deck/protocol';

/**
 * The phone's end of the Gate 0 link (G0-1, G0-2). Connects to the paired PC, runs the
 * hello and key derivation from packages/protocol, keeps the waiting requests, and
 * reconnects by itself after a drop (a first step towards C-4).
 */

const random = (n: number) => Crypto.getRandomValues(new Uint8Array(n));
const PHONE_ID = Crypto.randomUUID();

export type LinkState = 'unpaired' | 'connecting' | 'linked' | 'retrying';

export interface LinkEvent {
  at: number;
  text: string;
}

export function useLink(pairing: Pairing | null) {
  const [state, setState] = useState<LinkState>('unpaired');
  const [pcName, setPcName] = useState('');
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [events, setEvents] = useState<LinkEvent[]>([]);
  const [lastSessionId, setLastSessionId] = useState('');
  const sendRef = useRef<((m: PhoneMessage) => void) | null>(null);

  const note = useCallback((text: string) => {
    setEvents((list) => [{ at: Date.now(), text }, ...list].slice(0, 40));
  }, []);

  useEffect(() => {
    if (!pairing) {
      setState('unpaired');
      return;
    }
    let stopped = false;
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let ping: ReturnType<typeof setInterval> | undefined;
    let hostIndex = 0;

    const connect = () => {
      if (stopped) return;
      const host = pairing.hosts[hostIndex % pairing.hosts.length];
      setState(hostIndex === 0 ? 'connecting' : 'retrying');
      const url = `ws://${host}:${pairing.port}`;
      const ws = new WebSocket(url);
      socket = ws;
      let channel: SecureChannel | null = null;
      let linked = false;
      const phoneNonce = random(32);
      const giveUp = setTimeout(() => ws.close(), 4000);

      ws.onopen = () => {
        const hello: HelloFromPhone = {
          t: 'hello',
          v: PROTOCOL_VERSION,
          pcId: pairing.pcId,
          phoneId: PHONE_ID,
          nonce: toBase64(phoneNonce),
        };
        ws.send(JSON.stringify(hello));
      };

      ws.onmessage = (event) => {
        const text = String(event.data);
        try {
          if (!channel) {
            const hello = JSON.parse(text) as HelloFromAgent;
            if (hello.t !== 'hello' || hello.v !== PROTOCOL_VERSION) throw new Error(`PC speaks version ${hello.v}`);
            const key = sessionKey(fromBase64(pairing.secret), phoneNonce, fromBase64(hello.nonce));
            channel = new SecureChannel(key, 'phoneToAgent', random);
            const ch = channel;
            sendRef.current = (m) => ws.readyState === WebSocket.OPEN && ws.send(ch.seal(m));
            // The first sealed frame proves to the PC that this phone holds the secret.
            sendRef.current({ t: 'ping' });
            return;
          }
          onMessage(channel.open<AgentMessage>(text));
        } catch (e) {
          note(`Link refused: ${(e as Error).message}`);
          ws.close();
        }
      };

      const onMessage = (m: AgentMessage) => {
        switch (m.t) {
          case 'ready':
            clearTimeout(giveUp);
            linked = true;
            hostIndex = 0;
            setState('linked');
            setPcName(m.pcName);
            setRequests(m.waiting);
            note(`Linked to ${m.pcName} at ${host}, encrypted.`);
            ping = setInterval(() => sendRef.current?.({ t: 'ping' }), 10000);
            break;
          case 'request':
            setRequests((list) => [...list, m.request]);
            setLastSessionId(m.request.sessionId);
            note(`Request: ${m.request.tool} ${m.request.summary}`);
            break;
          case 'resolved':
            setRequests((list) => list.filter((r) => r.id !== m.id));
            note(
              m.how === 'answered'
                ? 'Request answered in the terminal.'
                : m.how === 'gone'
                  ? 'Request ended on the PC (the hook gave up).'
                  : 'Request timed out.',
            );
            break;
          case 'followupSent':
            note('Follow-up handed to the session as its turn ended.');
            break;
          case 'pong':
            break;
        }
      };

      ws.onclose = () => {
        clearTimeout(giveUp);
        clearInterval(ping);
        sendRef.current = null;
        if (stopped) return;
        if (linked) note('Link lost; reconnecting.');
        else hostIndex++;
        setState('retrying');
        retry = setTimeout(connect, linked ? 500 : 1500);
      };
      ws.onerror = () => {
        // onclose follows and handles the retry.
      };
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(retry);
      clearInterval(ping);
      socket?.close();
    };
  }, [pairing, note]);

  const send = useCallback((m: PhoneMessage) => sendRef.current?.(m), []);

  const answer = useCallback(
    (id: string, decision: 'allow' | 'deny', message?: string) => {
      send({ t: 'answer', id, decision, message });
      setRequests((list) => list.filter((r) => r.id !== id));
      note(`Sent ${decision}${message ? `: "${message}"` : ''}.`);
    },
    [send, note],
  );

  const queueFollowup = useCallback(
    (sessionId: string, text: string) => {
      send({ t: 'followup', sessionId, text });
      note(`Queued follow-up: "${text}"`);
    },
    [send, note],
  );

  return { state, pcName, requests, events, lastSessionId, answer, queueFollowup };
}

/** Reads a scanned QR code; null if it is not a Deck pairing. */
export function parsePairing(text: string): Pairing | null {
  try {
    const p = JSON.parse(text) as Pairing;
    if (typeof p.secret === 'string' && Array.isArray(p.hosts) && typeof p.port === 'number' && p.pcId) return p;
  } catch {
    // Not JSON.
  }
  return null;
}
