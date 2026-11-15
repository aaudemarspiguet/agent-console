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
  type PhoneMessage,
} from '@deck/protocol';

/**
 * The phone's end of the link to the PC agent (C-1, C-2, C-4; handoff T8, T15).
 * Connects to the paired PC, runs the hello and key derivation from
 * packages/protocol, pings every 10 s, and reconnects by itself after a drop,
 * trying each of the PC's addresses in turn.
 */

const random = (n: number) => Crypto.getRandomValues(new Uint8Array(n));
/** New at every launch: the PC replaces an older link with a newer one. */
const PHONE_ID = Crypto.randomUUID();

export type LinkState = 'unpaired' | 'connecting' | 'linked' | 'retrying';

export interface LinkHandlers {
  onState(state: LinkState): void;
  onMessage(message: AgentMessage): void;
  log?(text: string): void;
}

export interface Link {
  /** False when the link is not up; nothing is queued. */
  send(message: PhoneMessage): boolean;
  stop(): void;
}

export function connect(pairing: Pairing, handlers: LinkHandlers): Link {
  const log = handlers.log ?? ((text: string) => console.log(`link: ${text}`));
  let stopped = false;
  let socket: WebSocket | null = null;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let ping: ReturnType<typeof setInterval> | undefined;
  let sender: ((m: PhoneMessage) => boolean) | null = null;
  let hostIndex = 0;

  const open = () => {
    if (stopped) return;
    const host = pairing.hosts[hostIndex % pairing.hosts.length];
    handlers.onState(hostIndex === 0 ? 'connecting' : 'retrying');
    const ws = new WebSocket(`ws://${host}:${pairing.port}`);
    socket = ws;
    let channel: SecureChannel | null = null;
    let linked = false;
    const phoneNonce = random(32);
    const giveUp = setTimeout(() => ws.close(), 4000);

    ws.onopen = () => {
      const hello: HelloFromPhone = { t: 'hello', v: PROTOCOL_VERSION, pcId: pairing.pcId, phoneId: PHONE_ID, nonce: toBase64(phoneNonce) };
      ws.send(JSON.stringify(hello));
    };

    ws.onmessage = (event) => {
      const text = String(event.data);
      let message: AgentMessage;
      try {
        if (!channel) {
          const hello = JSON.parse(text) as HelloFromAgent;
          if (hello.t !== 'hello' || hello.v !== PROTOCOL_VERSION) throw new Error(`the PC speaks version ${hello.v}, this phone ${PROTOCOL_VERSION}`);
          const ch = new SecureChannel(sessionKey(fromBase64(pairing.secret), phoneNonce, fromBase64(hello.nonce)), 'phoneToAgent', random);
          channel = ch;
          sender = (m) => {
            if (ws.readyState !== WebSocket.OPEN) return false;
            ws.send(ch.seal(m));
            return true;
          };
          // The first sealed frame proves to the PC that this phone holds the secret.
          sender({ t: 'ping' });
          return;
        }
        message = channel.open<AgentMessage>(text);
      } catch (e) {
        log(`refused: ${(e as Error).message}`);
        ws.close();
        return;
      }
      if (message.t === 'ready') {
        clearTimeout(giveUp);
        linked = true;
        hostIndex = 0;
        log(`linked to ${message.pcName} at ${host}`);
        clearInterval(ping);
        ping = setInterval(() => sender?.({ t: 'ping' }), 10000);
        handlers.onState('linked');
      }
      if (message.t !== 'pong') handlers.onMessage(message);
    };

    ws.onclose = () => {
      clearTimeout(giveUp);
      clearInterval(ping);
      if (socket === ws) sender = null;
      if (stopped) return;
      if (linked) log('link lost; reconnecting');
      else hostIndex += 1;
      handlers.onState('retrying');
      retry = setTimeout(open, linked ? 500 : 1500);
    };
    ws.onerror = () => {
      // onclose follows and handles the retry.
    };
  };

  open();
  return {
    send: (m) => sender?.(m) ?? false,
    stop: () => {
      stopped = true;
      clearTimeout(retry);
      clearInterval(ping);
      sender = null;
      socket?.close();
    },
  };
}

/** Reads a scanned QR code; null if it is not a Deck pairing. */
export function parsePairing(text: string): Pairing | null {
  try {
    const p = JSON.parse(text) as Pairing;
    if (typeof p.secret === 'string' && Array.isArray(p.hosts) && p.hosts.length > 0 && typeof p.port === 'number' && p.pcId) return p;
  } catch {
    // Not JSON.
  }
  return null;
}
