# Handoff: state of the project on 2026-11-13

Read this with [product-brief.md](../product-brief.md) (version 7), which holds the requirements. This file holds where the work stands, what is wrong, and the tasks in order.

## What the product is

A free iPhone app that sits beside the keyboard as a "deck" for coding agents, with a tray agent on the Windows PC. The phone shows every agent session, answers permission requests with a key press, and replies by voice. Requirement IDs such as K-2 or E-5 refer to the brief.

## Where things are

| Path | What it is | State |
|---|---|---|
| `product-brief.md` | Requirements, trade-offs, feasibility research | Current (version 7) |
| `competitor-research.md` | Earlier research on similar products | Reference |
| `apps/mobile` | The phone app: Expo SDK 58, React Native 0.88, TypeScript | Runs in Expo Go; one screen; does not match the design yet |
| `apps/agent` | The PC side: a Node script | Stub. Prints protocol version and network addresses |
| `packages/protocol` | Types shared by phone and PC | Version constant and key ids only |
| `design/mockups` | The design boards (HTML) and the scripts that generate them | Current design, drawn at the wrong phone size |
| `design/saved-keycaps-v1` | An older design, kept for reference | Superseded |
| `spike/console-typing` | Scripts that proved the effort-wheel route | Working test scripts, not product code |

## Decisions already made (do not reopen without the user)

- **Stack:** one codebase in React Native with Expo, for iPhone now and Android later (stretch goal S5). No separate native apps and no Mac. Keep the code free of iOS-only libraries where a cross-platform one exists.
- **Package manager:** pnpm, as one workspace. Use `pnpm exec expo install <package>` for Expo libraries so versions match the SDK.
- **Builds:** the user will pay for the Apple Developer Program and use development builds made by Expo's cloud service. Expo Go is a stopgap until the account is active. The speech library is already installed for that reason.
- **Keys:** fixed legends, one action each, no app icons on keys, nothing changes outside the island except lights (K-1 to K-3).
- **Key grid:** five columns by four rows (K-11), six number keys (K-10), two saved-reply keys (R-1 to R-5).
- **Effort wheel:** required (K-9, E-1 to E-7), delivered by typing `/effort` into the session's console.
- **Product name:** must not contain "Claude". The user renamed the workspace to `agent-console`; the app's display name is still the working title "Deck".

## What is wrong right now

The phone app's look was written without ever being viewed, and it does not match the mockups. The user has seen it on an iPhone 17 and reported:

1. **The "Effort" label wraps onto two lines.** It sits in a 40-point column in `apps/mobile/src/PlateParts.tsx` with nothing stopping the wrap.
2. **The glass and softness are missing.** The mockups blur what is behind each key and put a blurred coloured glow under lit keys. The app uses flat gradients and has no glow.
3. **The island pill is thicker than the phone's own cutout,** leaving a visible black border. The user accepted this for now.
4. **Left out on purpose so far:** glyphs on keys, the plate's grain texture, and every lit state (all lights are off because nothing is connected).

Two causes sit under all of these:

- **Nobody could see the result.** There is no iPhone simulator on Windows, and only type checks were run.
- **The mockups are the wrong size.** They are drawn at 844 by 390 points. The iPhone 17 is believed to be 874 by 402, but that figure and the cutout's size and position came from memory and are **not verified**.

## Tasks, in order

Each task is sized to hand to one session. Do them in this order unless the user says otherwise; later tasks depend on earlier ones.

### T1. Measure the real phone
- **Do:** make the app show its own screen size and safe-area insets (a temporary on-screen readout or a log line), and ask the user to read them off their iPhone 17 in both landscape directions. Check Apple's published screen size from a live source as well.
- **Done when:** the real figures are written into this file, replacing the "not verified" note above.

### T2. Set up a way to see the app
- **Do:** add the web target to `apps/mobile` (`react-native-web` and what Expo needs for it), and a `.claude/launch.json` entry so the app opens in the built-in browser at the size measured in T1. Confirm the current screen renders there.
- **Done when:** a session can open the app and a mockup board side by side and compare them. Note in this file which effects the web view cannot be trusted for (glass, shadows, haptics).
- **Also:** agree with the user that they send a phone screenshot at each visual milestone, because the web view will differ from iOS.

### T3. Redraw the mockups at the real size
- **Do:** change the generators in `design/mockups` from 844 by 390 to the size from T1, and move the island to the measured cutout position. See `design/mockups/README.md`.
- **Done when:** all boards regenerate with no leftover `@@` tokens, keys do not overlap or overflow, and the canvas is republished.

### T4. Fix the two plain defects
- **Do:** stop the "Effort" label wrapping, and set the island pill's margin from the T1 measurements.
- **Done when:** checked in the T2 view and confirmed by the user on the phone.

### T5. Choose how to draw glass and glow
- **Do:** from live documentation, find which of these work in Expo Go and which need a development build: Expo's glass-effect library (Apple's real Liquid Glass), `expo-blur`, and a drawing library such as React Native Skia. Build one number key each way that is practical, with its coloured glow lit, and compare with the mockup.
- **Done when:** the user has picked one from screenshots. Note for them: glass only looks like glass with something behind it, and in the mockup most of that comes from the glow under lit keys.

### T6. Restyle the deck to match the mockups
- **Do:** apply the choice from T5 to every key, add the glow and lit states behind a temporary demo switch, and add the plate grain if it can be done cheaply.
- **Done when:** the T2 view matches the redrawn mockup board "1 · At rest", and the user confirms on the phone.

### T7. Decide legends and glyphs (needs the user)
- **Open question:** on the smaller keys, legend and glyph together look crowded. The last recommendation was words only at 13 points on single-cell keys, and glyph plus word on wide keys. The user has not ruled.
- **Done when:** the user has chosen, and the mockups, brief (K-2) and app agree.

### T8. Gate 0 spike: the connection
- **Do:** G0-1 to G0-3 in the brief. The phone pairs with `apps/agent` over the local network and exchanges encrypted messages; one Claude Code permission request reaches the phone through a hook and an Allow or Deny goes back. Put message shapes in `packages/protocol`.
- **Done when:** the three gate items are demonstrated and their results are written into the brief's feasibility section.
- **Independent of T1 to T7**, so it can run in parallel in its own session.

### T9. Finish the effort-wheel tests (needs the user at the PC)
- **Do:** the items still open under G0-5: an elevated terminal (needs a UAC prompt answered), the user typing at the same moment, how the PC agent finds a session's process from its hooks, whether a hook reports the current effort level, and whether the prompt box's stash state can be told before Ctrl+S is sent.
- **Use:** `spike/console-typing`. Read its README first; it types into real sessions.

### T10. First development build (needs the user)
- **User does:** enrol in the Apple Developer Program, create an Expo account, and choose a bundle identifier (hard to change later).
- **Then:** configure the cloud build, make a development build, and install it on the phone.

### Later, from the brief
The island's open states (session list, request, transcript, results), layout mode, voice, the PC tray agent proper, and more agents. Take these from the brief's releases in order once T1 to T8 are done.

## Open decisions

- **Legends and glyphs** (T7).
- **The tray agent's language.** The spike uses Node. The real agent needs a tray icon and Windows console calls; C# does both easily but shares no code with the phone, and the .NET SDK is not installed on this PC.
- **How far to use console typing** beyond the effort wheel (brief, open decision 5).
- **Bundle identifier, final name, licence.**
- **The `apple-design` skill** under `.claude/skills` contains Apple's guideline text. Remove it before making the repository public.

## How to run things

```bash
pnpm install
```

```bash
pnpm --filter mobile go
```

That starts the phone app for Expo Go: scan the QR code with the iPhone camera, with phone and PC on the same Wi-Fi.

```bash
pnpm typecheck
```

```bash
pnpm agent
```

## The design canvas

- **Published at:** https://claude.ai/artifact/13hkDcihBpCLtnBrE9AEk8 (private to the user).
- **Source:** `design/mockups`. See its README for how to regenerate and republish.
- **An earlier clickable prototype:** https://claude.ai/artifact/AXbJJjbCaffPhaM8E1Zdy3. It predates the wheel, the six number keys and the saved replies.

## Traces left on the PC by earlier testing

- The Codex CLI was updated from 0.166.0 to 0.169.0 by an accidental key press during the console-typing test.
- Claude Code has a scratch test folder marked as trusted.
- pnpm is allowed to run esbuild's install script (`pnpm-workspace.yaml`).
