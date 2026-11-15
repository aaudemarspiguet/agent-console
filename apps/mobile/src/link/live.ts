import type { Pairing } from '@deck/protocol';
import { island } from '../island/store';
import { SOURCE } from '../island/source';
import { connect, type Link } from './client';
import { loadPairing, savePairing } from './pairingStore';

/**
 * Feeds the island from the PC link (handoff T15): loads the saved pairing, or
 * shows the pairing view; connects; passes every message to the island and lets
 * the island's keys send. Returns a function that stops it. Does nothing while
 * the island runs on the demo.
 */
export function startLive(): () => void {
  if (SOURCE !== 'live') return () => {};
  let link: Link | null = null;
  let stopped = false;

  const start = (pairing: Pairing) => {
    link?.stop();
    link = connect(pairing, { onState: island.linkState, onMessage: island.onAgent });
    island.out = (m) => link?.send(m) ?? false;
  };

  island.onPaired = (pairing) => {
    savePairing(pairing).catch(() => {});
    start(pairing);
  };

  loadPairing().then((pairing) => {
    if (stopped) return;
    if (pairing) start(pairing);
    else island.needPairing();
  });

  return () => {
    stopped = true;
    link?.stop();
    link = null;
    island.out = () => false;
  };
}
