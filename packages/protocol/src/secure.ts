import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';

/**
 * The encrypted link (C-2). Both sides hold the 32-byte secret from the QR code.
 * Each connection opens with two plain hellos that swap fresh random nonces; the
 * connection's key is HKDF-SHA256 of the secret salted with both nonces, so no two
 * connections share a key. Every later frame is sealed with XChaCha20-Poly1305
 * under a random 24-byte nonce, and carries a sequence number that must rise by one,
 * so a recorded frame cannot be replayed. The direction is bound into each frame,
 * so a frame cannot be reflected back at its sender. A frame that fails any check
 * closes the connection.
 *
 * Random bytes come from the caller: Node's crypto on the PC, expo-crypto on the
 * phone (React Native has no global WebCrypto).
 */

export type RandomBytes = (length: number) => Uint8Array;
export type Direction = 'phoneToAgent' | 'agentToPhone';

// Hermes, React Native's engine, has TextEncoder but not always TextDecoder, so
// UTF-8 is done by hand.
const enc = { encode: utf8Encode };
const dec = { decode: utf8Decode };

function utf8Encode(text: string): Uint8Array {
  const out: number[] = [];
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(out);
}

function utf8Decode(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i++];
    let c: number;
    if (b < 0x80) c = b;
    else if (b < 0xe0) c = ((b & 31) << 6) | (bytes[i++] & 63);
    else if (b < 0xf0) c = ((b & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    else c = ((b & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    s += String.fromCodePoint(c);
  }
  return s;
}

export function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function fromBase64(text: string): Uint8Array {
  const s = atob(text);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

function join(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

export function sessionKey(secret: Uint8Array, phoneNonce: Uint8Array, agentNonce: Uint8Array): Uint8Array {
  return hkdf(sha256, secret, join(phoneNonce, agentNonce), enc.encode('deck link v1'), 32);
}

/** One direction's sealing and opening, with its own sequence counters. */
export class SecureChannel {
  private sendSeq = 0;
  private recvSeq = 0;

  constructor(
    private readonly key: Uint8Array,
    private readonly sending: Direction,
    private readonly random: RandomBytes,
  ) {}

  private get receiving(): Direction {
    return this.sending === 'phoneToAgent' ? 'agentToPhone' : 'phoneToAgent';
  }

  /** Returns the text to send over the socket. */
  seal(message: unknown): string {
    const seq = this.sendSeq++;
    const nonce = this.random(24);
    const aad = enc.encode(`${this.sending}:${seq}`);
    const box = xchacha20poly1305(this.key, nonce, aad).encrypt(enc.encode(JSON.stringify(message)));
    return JSON.stringify({ s: seq, n: toBase64(nonce), c: toBase64(box) });
  }

  /** Throws if the frame was altered, replayed, reordered or reflected. */
  open<T>(frame: string): T {
    const { s, n, c } = JSON.parse(frame) as { s: number; n: string; c: string };
    if (s !== this.recvSeq) throw new Error(`frame ${s} out of order, expected ${this.recvSeq}`);
    const aad = enc.encode(`${this.receiving}:${s}`);
    const plain = xchacha20poly1305(this.key, fromBase64(n), aad).decrypt(fromBase64(c));
    this.recvSeq++;
    return JSON.parse(dec.decode(plain)) as T;
  }
}
