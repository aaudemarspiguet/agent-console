# Deck

An iPhone console for coding agents, with a small agent on your Windows PC.

Put your phone beside your keyboard and it shows every agent session: which one is working,
which one is waiting, and the exact command it wants to run. Press **Allow** or **Deny** on the
phone without switching windows, or **Always Allow** for the rest of that session. Each session
gets its own number key and a light that shows its state.

> Working title "Deck". The app is in active development and not yet released.

## How it works

```
 iPhone (Expo app)  <-- encrypted WebSocket, local Wi-Fi -->  PC agent (Node)  <-- hooks -->  coding agents
```

- **Phone app** (`apps/mobile`): Expo SDK 58 and React Native, TypeScript. One landscape screen:
  a five-by-four grid of keys with fixed legends, and a screen in an island beside the camera
  that lists sessions and opens when something needs you. Keys use Apple's Liquid Glass on
  iOS 26, with haptics and a recorded key sound.
- **PC agent** (`apps/agent`): Node and TypeScript. Pairs with the phone through a QR code,
  installs its own Claude Code hooks, tracks sessions from them, and answers permission
  requests with what you pressed on the phone.
- **Protocol** (`packages/protocol`): the message types both sides share, and the encrypted
  channel (XChaCha20-Poly1305, keyed by the secret in the pairing QR code).
- **Design** (`design/mockups`): the design boards and the scripts that generate them.

No relay server and no account: the phone talks to your PC directly over your own network.

## Status

| Part | State |
|---|---|
| Pairing, encrypted link, session list | Working with Claude Code |
| Allow, Always Allow, Deny, saved replies, queued follow-ups | Working with Claude Code |
| Keys, island, glass, sound and haptics | Built and tuned on an iPhone 17 |
| Codex, Cursor, Gemini | Planned, each behind its own adapter |
| Voice replies, live effort wheel | Planned |

The full requirements are in [product-brief.md](product-brief.md), and where the work stands,
with the task list, is in [docs/HANDOFF.md](docs/HANDOFF.md).

## Run it

Requires Node and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm agent                          # PC agent: prints a QR code to pair the phone
pnpm --filter mobile go             # phone app in Expo Go
pnpm agent --install-hooks --dry-run   # preview the hooks it adds to ~/.claude/settings.json
pnpm typecheck
```

`pnpm agent --install-hooks` writes the hooks for real, and `--remove-hooks` takes them out.

## Why

Agents spend a lot of time blocked on a permission prompt in a window you aren't looking at.
Deck puts every agent's prompt on one surface that is always in view, whichever vendor's agent
it is, and keeps the answer to a single press.
