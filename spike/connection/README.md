# Spike: the connection (Gate 0, handoff T8)

This spike shows that the phone and the PC can pair, talk over an encrypted link, and pass one Claude Code permission request and its answer through a hook (brief G0-1 to G0-3). The code is in the real places (`apps/agent`, `packages/protocol`, `apps/mobile/src/link`), but the phone screen is a plain test screen, not the deck.

## Pieces

- **`packages/protocol`**
  - `messages.ts`: the message shapes.
  - `secure.ts`: the encrypted channel. A 32-byte secret travels only in the QR code. Each connection starts with two plain hellos that swap random nonces. The connection key is HKDF-SHA256(secret, both nonces). Every later frame is XChaCha20-Poly1305 with a random nonce, a sequence number that must go up by one, and the direction bound in. The libraries are `@noble/ciphers` and `@noble/hashes`, pure JavaScript, so they run the same in Expo Go, on the web and in Node. The random bytes come from `expo-crypto` on the phone and `node:crypto` on the PC.
- **`apps/agent`** (`pnpm agent`)
  - Prints a QR code with the PC's addresses, port and secret.
  - Keeps the secret in `~/.deck/agent.json`, so a paired phone can reconnect. `--new-pairing` replaces it.
  - The link is a WebSocket on port 8765.
  - The hooks are an HTTP server on 127.0.0.1:8766 only: `POST /hooks/permission-request` and `POST /hooks/stop`.
  - `pnpm --filter agent linkcheck` checks, against the running agent, that a wrong secret, a replayed frame and the wrong PC id are all refused.
- **`apps/mobile/src/link`**
  - `useLink.ts` connects, runs the handshake and reconnects after a drop.
  - `LinkSpike.tsx` is the test screen. Set `SCREEN` to `'link'` in `App.tsx`.
  - On the web, a pairing can be put after `#` in the address (URL-encoded JSON), because there is no camera.
- **`playground/`**: a throwaway project whose `.claude/settings.json` points Claude Code's `PermissionRequest` and `Stop` hooks at the agent. Run Claude Code in this folder to test. It does not touch your user settings.

## How a request travels

1. Claude Code is about to ask for permission. It POSTs the request to the agent (`type: "http"` hook).
2. The agent holds the HTTP request open and sends the request to the phone.
3. The phone answers, and the agent replies to Claude Code:
   - Allow: `{"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"allow"}}}`.
   - Deny: `"behavior":"deny"` plus a `message`.
4. If no phone is linked, the agent answers at once with an empty 200, which means "no decision".
5. If Claude Code drops the request (its wait ran out, or it was answered in the terminal), the agent tells the phone the request is gone.
6. A follow-up the phone queued is handed over by the Stop hook as `additionalContext` when the session's turn ends. `DECK_FOLLOWUP_STYLE=block` uses `decision: "block"` instead.

## Results

The results are in the brief, under "Tested on this PC (2026-11-13): the connection".

## Gotchas

- **The agent outlives its runner.** Stopping `pnpm agent` from a background runner can leave the `node` process holding port 8765. The next start then fails with `EADDRINUSE`. Find the process with `Get-NetTCPConnection -LocalPort 8765` and stop it.
- **`curl` on Windows mangles backslashes** in JSON passed with `-d '...'`. Send a file with `--data-binary @file` instead.
- **Link-local addresses** (169.254.x.x) are left out of the QR code, because a phone can't reach them.
