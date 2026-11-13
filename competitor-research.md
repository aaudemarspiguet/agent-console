# Competitor research: phone control of AI coding agents

Researched 2026-11-12 from live sources. Three research agents opened primary sources (repos, docs, store listings); Perplexity was run on the same three questions as a cross-check; I then opened the Elgato Marketplace pages myself to settle one conflict between them.

## Bottom line

1. **The AI deck already exists, on Windows, for a few dollars.** The Elgato Marketplace has at least nine paid Claude Code plugins. Several run on Windows and put Allow / Always Allow / Deny, live session status, and model switching on Stream Deck keys.
2. **Happy and HAPI cover the "full client on your phone" version** of the same job: sessions, prompts, approvals, diffs, push notifications. Both run natively on Windows, both with a visible backlog of Windows bugs.
3. **Nothing found combines a touchpad with an agent deck.** No source for any of the three mentions pointer, touchpad, or free keyboard input. That is absence of mention across the pages opened, not a statement by the vendors.
4. **Not confirmed: whether the Claude Code plugins work on Stream Deck Mobile.** Every plugin is documented against hardware. Elgato's SDK treats Mobile as a device and offers it free for plugin development, so key actions should work, but no page says so.

## Side by side

| | Happy | HAPI | Stream Deck Mobile + plugin |
|---|---|---|---|
| What it is | Multi-agent desktop app with a phone companion | Self-hosted hub plus wrapper CLI | Key grid on the phone, driven by the Stream Deck desktop app |
| Cost | Free; voice is paid ($19.99/month in-app purchase listed) | Free web app; native apps are paid (price not confirmed) | Free for 6 keys; Pro $2.99/month, $24.99/year or $49.99 lifetime; plugins $2.20 to $7.99 |
| Phone client | iOS, Android | PWA, Telegram Mini App, native iOS and Android | iPhone, iPad, Android |
| Windows host | Native desktop app; open bugs include "App unusable on Windows" | Native binary; about 60 Windows-titled issues | Desktop app on Windows 10+; several plugins Windows-capable |
| Approve / deny from phone | Yes | Yes, including from push notifications | Yes, in several plugins |
| Model / effort switching | Yes | Not confirmed for Claude Code or Codex | Yes in Claude Code Deck (macOS only); a Model key in Claude Deck Windows |
| Read the conversation | Yes | Yes | No, keys only |
| Works away from home network | Yes, via encrypted relay | Yes, via relay or your own tunnel | Not confirmed; same Wi-Fi or USB documented |
| Touchpad / pointer | None found | None found | None found |
| App launcher / hotkeys | None found | None found | Yes, core feature |
| Open source | MIT | AGPL-3.0 | No (some community plugins are MIT) |

## Happy

- Active: about 24.6k stars, MIT, pushed 2026-11-12. It has pivoted from a Claude Code wrapper CLI (now in maintenance mode) to a desktop app that runs the agent loop itself, with the phone as a companion.
- Supports Claude, Codex, Grok, Gemini via Antigravity, and other agents in beta.
- Phone features: session list, new sessions, prompts with images, stop, approve/deny, model, reasoning effort and permission mode, diffs, push notifications, voice.
- Phone traffic goes through an end-to-end encrypted relay, which can be self-hosted. A direct local connection appeared only in a preview build dated 2026-11-12.
- iOS Live Activities is an open request (issue #338, opened 2026-01-06).
- Complaints: Windows bugs (#1729, #1888, #1941, #1950), a roughly 20-hour hosted-server outage (#1682), about 1,100 open issues and PRs.

## HAPI

- Active: about 5.4k stars, AGPL-3.0, v0.35.0 released 2026-11-12.
- You run a hub on your own machine; history stays in a local SQLite file. No central account server.
- Supports Claude Code, Codex, Cursor Agent, Grok Build, Copilot, and others. Gemini CLI support was removed.
- Approvals for Claude Code are bridged through Claude Code's `PermissionRequest` hook. This is a working open-source reference for the mechanism planned for FR15.
- Remote access uses a managed tunnel, or your own Cloudflare tunnel, Tailscale or ngrok. Encryption is transport-level only, and data at rest is plaintext.
- Remote terminal and voice assistant are web-only.
- Complaints: the host must stay awake; Windows rough edges, several closed "not planned"; relay rate limits.

## Stream Deck Mobile

- Requires the Stream Deck desktop app (Windows 10+ or macOS). No hardware needed.
- Pairs by QR code on the same Wi-Fi; USB for iPhone since 2.3.0 (needs the Apple Devices app on Windows).
- Up to 64 keys on iPhone with Pro. Profiles, folders, pages, landscape layouts. Dial emulation and haptics are not confirmed.
- Plugins are TypeScript on Node.js and can push key titles and images at runtime.
- Elgato's official MCP server runs the other direction: an AI triggers Stream Deck actions. It does not show agent status or approvals.
- Elgato's official ChatGPT & Codex plugin signals "waiting for approval" but you approve in ChatGPT itself.
- Complaints: disconnects, and failure to reconnect after the computer sleeps or locks.

### Claude Code plugins on the Elgato Marketplace

I opened each of these pages. The research agent missed this group because the Marketplace search URL does not filter by keyword; Perplexity surfaced the first one.

| Plugin | Maker | OS | Price | What it does |
|---|---|---|---|---|
| Claude Code Deck | Bouncing Ball Limited | macOS | $6.61 | One key per session with status; Allow / Always Allow / Deny naming the tool and exact command; answer multiple-choice questions; model, effort, speed; usage, cost, pull request state. v1.1, 2026-11-02 |
| Claude Code Approver | Mlifell | macOS, Windows | $3.99 | Allow / Always Allow / Deny keys labelled with the tool name; live status key per session; plan usage. v1.3.5, 2026-08-05 |
| ClauDeck | onavascuez | macOS, Windows | $5.14 | One key per session; approve / always-allow / deny; answer questions; usage forecast. v1.1.1, 2026-09-15 |
| ClaudeDeck | Chavez Software | macOS, Windows | $7.99 | Approve/deny via hooks; token and context usage; voice controls (desktop-app control is macOS only). v1, 2026-09-07 |
| Agent Deck for Claude Code | Barbanson Data Solutions | macOS, Windows | $2.20 | One row per project showing state, including waiting for approval; "answer it with one press". v1.0.1, 2026-09-23 |
| Claude Deck Windows | Vibecode-Studio | Windows | $2.20 | Session status keys; press to focus the exact terminal tab; Interrupt, Compact, Model, Clear, Mode, prompt macros. v1.1, 2026-10-14 |
| Claude Deck Mac | Vibecode-Studio | macOS | $2.20 | Same as above for macOS. v1.1, 2026-10-21 |
| Claude Code Usage | AS Business Solutions GmbH | Windows | $4.41 | Spend, plan limits, session countdown; launches sessions; detects sessions across Windows and WSL. v1.12.3, 2026-08-03 |
| Auto Queue for Claude Code | PackRat | Windows | $5.99 | Queue follow-up prompts that run when the current turn finishes. v0.1, 2026-09-07 |

Free community plugins on GitHub with approve/deny: Agent Vitals (Windows and macOS, MIT), agentsd (macOS), ClaudeDeck by nickboy (macOS + Ghostty). All are small, 0 to 11 stars.

## Engineering notes worth keeping

- **Hooks are the proven route.** HAPI and most plugins receive Claude Code hook events on a local listener. agentsd holds a `PermissionRequest` open for up to 120 seconds waiting for the key press.
- **Holding the connection can be unreliable.** One plugin author (nickboy) switched from held hook connections to typing the answer into the terminal.
- **The admin-window limit is real.** Claude Deck Windows documents it: if Windows Terminal runs as administrator, the plugin cannot switch tabs or type into it.
- **Plugins that type into the terminal** need the right window focused first; Claude Deck Windows only types after confirming the correct tab is active.

## What this means for the plan

- **P0 touchpad:** unaffected. None of these products has one.
- **P1 touchbar (launchers, hotkeys):** Stream Deck Mobile does this well already.
- **P2 AI deck:** this is no longer open ground. The remaining differences are narrower:
  - one app and one pairing instead of a desktop app, a phone app, and a plugin;
  - touchpad and deck on the same screen;
  - agent tiles that appear with no layout work;
  - lock-screen or Live Activity status, which Happy has not shipped and no plugin offers.
- **Cheap test before building P2:** install Stream Deck Mobile (free, 6 keys) and one Windows-capable approval plugin such as Claude Code Approver ($3.99). That answers the unconfirmed question of whether plugins work on Mobile, and shows first-hand what the deck experience is missing.

## Gaps in this research

- Plugin compatibility with Stream Deck Mobile: not confirmed anywhere.
- Marketplace listing is not exhaustive; I followed one plugin's "related" list.
- Reddit was not checked for any of the three; download counts were not visible.
- Elgato help-centre articles and the Google Play listings did not load.
- Perplexity's quick answers were thin; they left pricing, Windows support, and architecture open, and contributed mainly the Claude Code Deck lead.
- Happy's App Store notes and website disagree on free voice minutes (one hour versus 20 minutes per 30 days).

## Sources

Happy
- https://github.com/slopus/happy
- https://happy.engineering/welcome/
- https://happy.engineering/mobile/
- https://happy.engineering/how-it-works/
- https://happy.engineering/docs/security/
- https://happy.engineering/docs/guides/self-hosting/
- https://happy.engineering/claude-code-remote-control/
- https://apps.apple.com/us/app/happy-claude-code-client/id6748571505

HAPI
- https://github.com/tiann/hapi
- https://hapi.run/docs/guide/how-it-works.html
- https://hapi.run/docs/guide/why-hapi.html
- https://hapi.run/docs/guide/agents.html
- https://hapi.run/docs/guide/native-apps.html
- https://hapi.run/docs/guide/faq.html
- https://hapi.run/docs/guide/deployment.html

Stream Deck Mobile
- https://apps.apple.com/us/app/elgato-stream-deck-mobile/id1440014184
- https://www.elgato.com/us/en/s/stream-deck-mobile
- https://docs.elgato.com/streamdeck/sdk/introduction/getting-started
- https://docs.elgato.com/streamdeck/sdk/guides/keys
- https://docs.elgato.com/streamdeck/sdk/guides/devices
- https://www.elgato.com/us/en/explorer/products/stream-deck/sd-mcp-setup/
- https://www.elgato.com/us/en/explorer/products/stream-deck/control-chatgpt-and-codex-from-stream-deck/

Marketplace plugins
- https://marketplace.elgato.com/product/claude-code-deck-4d2fa3b1-1771-4edf-9569-055adbe90018
- https://marketplace.elgato.com/product/claude-code-approver-773682f5-091b-474b-8901-d9960c50f0d3
- https://marketplace.elgato.com/product/claudeck-2ed8dd1e-1a28-4442-b5df-7d2e16d4f6d1
- https://marketplace.elgato.com/product/claudedeck-57c107a2-129a-490f-8ab6-526a6c698213
- https://marketplace.elgato.com/product/agent-deck-for-claude-code-81b14412-7d56-4ccc-8291-88707fb13a06
- https://marketplace.elgato.com/product/claude-deck-windows-6e1de896-fa21-4bf6-a5b7-f272dfe733a8
- https://marketplace.elgato.com/product/claude-deck-mac-25ddf693-00b6-4ed6-9e65-2b8fea181069
- https://marketplace.elgato.com/product/claude-code-usage-ea7abd37-ad12-473a-a9cd-ab0bfeba3e3c
- https://marketplace.elgato.com/product/auto-queue-for-claude-code-855aa1f7-40b5-4353-b1f4-4a954d5d33b9

Community plugins
- https://github.com/tapparello/agent-vitals
- https://github.com/paultyng/agentsd
- https://github.com/nickboy/claudedeck
- https://nickboy-github-io.pages.dev/posts/permission-round-trip/
