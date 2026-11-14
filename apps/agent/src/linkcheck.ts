// Checks that the running agent refuses bad links (handoff T8). Run while the agent
// is up: `pnpm --filter agent linkcheck`. Reads the pairing from ~/.deck/agent.json.
//   1. the right secret links;
//   2. a wrong secret is dropped at its first sealed frame;
//   3. a replayed frame is dropped;
//   4. a frame from a different pairing's PC id is dropped at the hello.
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { PROTOCOL_VERSION, SecureChannel, fromBase64, sessionKey, toBase64, type HelloFromAgent } from '@deck/protocol';

const stored = JSON.parse(readFileSync(join(homedir(), '.deck', 'agent.json'), 'utf8')) as { pcId: string; secret: string };
const random = (n: number) => new Uint8Array(randomBytes(n));
const port = Number(process.env.DECK_LINK_PORT ?? 8765);

/** Resolves with what happened: 'linked' if a 'ready' arrived, else 'closed'. */
function attempt(opts: { secret: Uint8Array; pcId: string; replay?: boolean }): Promise<string> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    const nonce = random(32);
    let channel: SecureChannel | null = null;
    let firstFrame = '';
    const timer = setTimeout(() => {
      ws.close();
      resolve('no answer');
    }, 3000);
    ws.on('open', () =>
      ws.send(JSON.stringify({ t: 'hello', v: PROTOCOL_VERSION, pcId: opts.pcId, phoneId: 'linkcheck', nonce: toBase64(nonce) })),
    );
    ws.on('message', (data) => {
      const text = data.toString();
      if (!channel) {
        const hello = JSON.parse(text) as HelloFromAgent;
        channel = new SecureChannel(sessionKey(opts.secret, nonce, fromBase64(hello.nonce)), 'phoneToAgent', random);
        firstFrame = channel.seal({ t: 'ping' });
        ws.send(firstFrame);
        return;
      }
      const m = channel.open<{ t: string }>(text);
      if (m.t === 'ready') {
        if (opts.replay) {
          ws.send(firstFrame); // the same frame again
          return;
        }
        clearTimeout(timer);
        ws.close();
        resolve('linked');
      }
    });
    ws.on('close', () => {
      clearTimeout(timer);
      resolve('closed');
    });
  });
}

const secret = fromBase64(stored.secret);
const results = {
  rightSecret: await attempt({ secret, pcId: stored.pcId }),
  wrongSecret: await attempt({ secret: random(32), pcId: stored.pcId }),
  replay: await attempt({ secret, pcId: stored.pcId, replay: true }),
  wrongPc: await attempt({ secret, pcId: 'someone-else' }),
};
console.log(results);
const ok =
  results.rightSecret === 'linked' &&
  results.wrongSecret === 'closed' &&
  results.replay === 'closed' &&
  results.wrongPc === 'closed';
console.log(ok ? 'All four as expected.' : 'NOT as expected.');
process.exit(ok ? 0 : 1);
