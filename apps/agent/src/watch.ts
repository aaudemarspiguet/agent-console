// A stand-in phone for testing the agent without the app (handoff T14). Links with the
// pairing in ~/.deck/agent.json and prints every message: the snapshot in `ready`,
// session changes, requests.
//
//   pnpm --filter agent watch                  print only
//   pnpm --filter agent watch --answer allow   also answer every request: allow, always or deny
//   pnpm --filter agent watch --reconnect 5    drop the link after 5 s and link again (checks the snapshot)
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import {
  PROTOCOL_VERSION,
  SecureChannel,
  fromBase64,
  sessionKey,
  toBase64,
  type AgentMessage,
  type HelloFromAgent,
  type PhoneMessage,
  type SessionInfo,
} from '@deck/protocol';

const stored = JSON.parse(readFileSync(join(homedir(), '.deck', 'agent.json'), 'utf8')) as { pcId: string; secret: string };
const random = (n: number) => new Uint8Array(randomBytes(n));
const port = Number(process.env.DECK_LINK_PORT ?? 8765);
const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const answer = arg('--answer') as 'allow' | 'always' | 'deny' | undefined;
const reconnectAfter = Number(arg('--reconnect') ?? 0);

const time = () => new Date().toISOString().slice(11, 23);
const row = (s: SessionInfo) =>
  `[${s.key}] ${s.project} ${s.state}${s.effort ? ` (${s.effort})` : ''}${s.tools.length ? ` | ${s.tools.join(' | ')}` : ''}`;

function link(round: number) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  const nonce = random(32);
  let channel: SecureChannel | null = null;
  const send = (m: PhoneMessage) => channel && ws.send(channel.seal(m));

  ws.on('open', () => ws.send(JSON.stringify({ t: 'hello', v: PROTOCOL_VERSION, pcId: stored.pcId, phoneId: 'watch', nonce: toBase64(nonce) })));
  ws.on('message', (data) => {
    const text = data.toString();
    if (!channel) {
      const hello = JSON.parse(text) as HelloFromAgent;
      channel = new SecureChannel(sessionKey(fromBase64(stored.secret), nonce, fromBase64(hello.nonce)), 'phoneToAgent', random);
      send({ t: 'ping' });
      return;
    }
    const m = channel.open<AgentMessage>(text);
    switch (m.t) {
      case 'ready':
        console.log(`${time()} ready (link ${round}) from ${m.pcName}: ${m.sessions.length} sessions, ${m.waiting.length} waiting`);
        for (const s of m.sessions) console.log(`             ${row(s)}`);
        if (reconnectAfter && round === 1)
          setTimeout(() => {
            console.log(`${time()} dropping the link to link again`);
            ws.close();
            setTimeout(() => link(2), 500);
          }, reconnectAfter * 1000);
        break;
      case 'session':
        console.log(`${time()} session ${row(m.session)}`);
        break;
      case 'sessionGone':
        console.log(`${time()} gone ${m.id.slice(0, 8)}`);
        break;
      case 'request':
        console.log(`${time()} request ${m.request.tool}: ${m.request.summary} (session ${m.request.sessionId.slice(0, 8)})`);
        if (answer) {
          // Wait out the 0.6 s the deck waits before its answer keys light (A-5).
          setTimeout(() => {
            console.log(`${time()} answering ${answer}`);
            send(
              answer === 'deny'
                ? { t: 'answer', id: m.request.id, decision: 'deny', message: 'Denied from the watch client.' }
                : { t: 'answer', id: m.request.id, decision: 'allow', always: answer === 'always' },
            );
          }, 600);
        }
        break;
      case 'resolved':
        console.log(`${time()} resolved ${m.id.slice(0, 8)}: ${m.how}`);
        break;
      case 'followupSent':
        console.log(`${time()} follow-up handed to ${m.sessionId.slice(0, 8)}`);
        break;
    }
  });
  ws.on('close', () => console.log(`${time()} link ${round} closed`));
  ws.on('error', (e) => console.log(`${time()} link error: ${e.message}`));
}

link(1);
