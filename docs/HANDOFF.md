# Handoff: state of the project on 2026-11-13

Read this with [product-brief.md](../product-brief.md) (version 8), which holds the requirements. This file holds where the work stands, what is wrong, and the tasks in order.

## What the product is

A free iPhone app that sits beside the keyboard as a "deck" for coding agents, with a tray agent on the Windows PC. The phone shows every agent session, answers permission requests with a key press, and replies by voice. Requirement IDs such as K-2 or E-5 refer to the brief.

## Where things are

| Path | What it is | State |
|---|---|---|
| `product-brief.md` | Requirements, trade-offs, feasibility research | Current (version 8) |
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

1. **The "Effort" label wrapped onto two lines.** Fixed in T4; confirmed on the phone.
2. **The glass and softness are missing.** The mockups blur what is behind each key and put a blurred coloured glow under lit keys. The app uses flat gradients and has no glow.
3. **The island pill was thicker than the phone's own cutout,** leaving a visible black border (49 × 137 against 37 × 125). Fixed in T4; confirmed on the phone.
4. **Left out on purpose so far:** glyphs on keys, the plate's grain texture, and every lit state (all lights are off because nothing is connected).

Two causes sit under all of these:

- **Nobody could see the result.** There is no iPhone simulator on Windows, and only type checks were run.
- **The mockups were the wrong size** (844 by 390; the phone is 874 by 402). Fixed in T3.

## Measured on the iPhone 17 (2026-11-13, T1)

Read from the user's iPhone 17 (iOS 26.6) in Expo Go with the temporary readout (`MEASURE` in `apps/mobile/App.tsx`, `src/Measure.tsx`), logged to Metro. Apple's spec page (apple.com/iphone-17/specs) gives 2622 by 1206 pixels at 460 ppi, which agrees.

| | Landscape | Portrait (for reference) |
|---|---|---|
| Window and screen | 874 × 402 pt | 402 × 874 pt |
| Scale | 3 | 3 |
| Safe-area insets | left 62, right 62, top 0, bottom 20 | top 62, bottom 34, left 0, right 0 |

What these show and do not show:

- **The insets are identical in both landscape directions** (left 62, right 62, bottom 20). They cannot tell which side the camera is on, so the island's side has to come from the orientation (`useCameraSide`).
- **Both directions were recorded.** `LANDSCAPE_RIGHT` gives camera side left and `LANDSCAPE_LEFT` gives camera side right, matching how the user held the phone. With the iPhone's rotation lock on, the app stays on one side and never reports the other.
- **`ScreenOrientation.lockAsync` works on iOS 26.6 in Expo Go:** locking to `LANDSCAPE_LEFT` or `LANDSCAPE_RIGHT` flipped the screen to that side (seen in the user's screenshots). Expo's documentation warns it may have no effect from iOS 27.
- **Expo Go ignores the app's landscape lock:** the window flipped to 402 × 874 several times while the orientation still read `LANDSCAPE_RIGHT`. A development build should honour `"orientation": "landscape"` in `app.json`; not verified.
- **The cutout (Dynamic Island) in landscape:** about **37 wide by 125 tall**, from about **14 to 51 points in from the camera edge**, and from about **y 139 to 264**, centred top to bottom (centre at x 32, y 201). It is the same, mirrored, on either side. iOS does not report it to apps, and a normal screenshot leaves it out. The user forced it into screenshots by placing a phone call first, so a live activity was running and iOS drew the island (with its orange microphone dot) into the capture. The figures were measured from those screenshots of the readout's 5-point grid (2000 × 920 pixel images, 2.29 pixels a point), so they are iOS's own drawing, accurate to about 1 point. One caveat: the island drawn during a call could be slightly larger than the bare cutout; with no extra content showing, it looked like the resting size. To repeat this on another phone: start a call, open the readout (`MEASURE`), take a screenshot in each direction.
- **What this means for the island pill (T4):** the cutout's centre (32 in) is where `islandInset` in `Deck.tsx` already centres the pill (half the 62 inset, plus 1). The pill is 49 × 137 (`PlateParts.tsx`), about 12 points wider and 12 taller than the cutout, which is the black border the user saw. The mockups draw it 38 × 140, 10 points from the edge.

## Tasks, in order

Each task is sized to hand to one session. Do them in this order unless the user says otherwise; later tasks depend on earlier ones.

### T1. Measure the real phone (done 2026-11-13)
- **Result:** see "Measured on the iPhone 17" above. The readout stays in `apps/mobile/src/Measure.tsx`, off by default; set `MEASURE` in `App.tsx` to true to measure another phone.
- **Do:** make the app show its own screen size and safe-area insets (a temporary on-screen readout or a log line), and ask the user to read them off their iPhone 17 in both landscape directions. Check Apple's published screen size from a live source as well.
- **Done when:** the real figures are written into this file, replacing the "not verified" note above.

### T2. Set up a way to see the app (done 2026-11-13)
- **Result:** the app runs on the web (`react-dom`, `react-native-web`, `@expo/metro-runtime`, per docs.expo.dev/workflow/web). `.claude/launch.json` has two entries: `deck-web` (the app on port 8090, so it does not clash with an Expo Go server on 8081) and `mockups` (a static server for `design/mockups` on 8091). `design/mockups/make-compare.ps1` turns each phone board into a plain page under `design/mockups/compare/` (ignored by git) and writes `compare/index.html`, which shows a chosen board (844 × 390) above the live app (874 × 402). To use it: run the script, start both entries, open `http://localhost:8091/compare/?board=Island1`, and set the browser pane to about 900 × 900. The first web start takes about a minute.
- **What the web view cannot be trusted for:**
  - **Safe-area insets are 0** on the web, so the side padding falls back to `END_MARGIN` and the island pill sits at the very edge (`islandInset(0)`), not 32 points in as on the phone. Do not judge the pill's position here; use the T1 figures and a phone screenshot.
  - **Camera side follows the browser's orientation,** which put the island on the right; the mockups draw it on the left. The layout is mirrored, not wrong.
  - **Fonts:** Windows has no SF Pro, so text metrics differ. The "Effort" label does not wrap on the web, but does on the phone. Check text fit on the phone.
  - **Glass, blur and shadows:** the web turns React Native shadows and blur into CSS, which the browser draws differently from iOS. Apple's Liquid Glass does not exist on the web. Use the web view for layout, size and colour, and phone screenshots for materials (T5, T6).
  - **Haptics, orientation lock and keep-awake** do nothing on the web.
  - **No cutout** is drawn, so the pill's fit against the real island cannot be seen.
- **Agreed way of working:** the user sends a phone screenshot at each visual milestone (end of T4, each option in T5, end of T6). Agreed by the user on 2026-11-13.
- **Do:** add the web target to `apps/mobile` (`react-native-web` and what Expo needs for it), and a `.claude/launch.json` entry so the app opens in the built-in browser at the size measured in T1. Confirm the current screen renders there.
- **Done when:** a session can open the app and a mockup board side by side and compare them. Note in this file which effects the web view cannot be trusted for (glass, shadows, haptics).
- **Also:** agree with the user that they send a phone screenshot at each visual milestone, because the web view will differ from iOS.

### T3. Redraw the mockups at the real size (done 2026-11-13)
- **Result:** every phone board is 874 × 402. The closed pill is now the measured cutout, 37 × 125 at x 14, y 139; open states start 14 in, and the key area starts 348 in when the island is open. The canvas positions were spaced for the new size, and the canvas is republished (version 46). All 17 boards regenerated with no `@@` left; a script check in the browser found no key overlapping another or leaving the board, and Island1, Island2, Island9 and Effort1 were looked at. Not checked: the canvas render itself (only local copies were viewed). Open point for T7 or later: the closed pill draws a glyph and a count inside a pill the size of the cutout, where on the phone the camera hardware sits; whether that content can show there is not known.
- **Do:** change the generators in `design/mockups` from 844 by 390 to the size from T1, and move the island to the measured cutout position. See `design/mockups/README.md`.
- **Done when:** all boards regenerate with no leftover `@@` tokens, keys do not overlap or overflow, and the canvas is republished.

### T4. Fix the two plain defects (done 2026-11-13)
- **Result:** the pill is now 37 × 125 (`PlateParts.tsx`), the measured cutout. `islandInset` already centres it on the cutout: with the 62-point inset it sits 13.5 points in (measured 14). The wheel's column is now 60 points wide instead of 40, with its centre still 31 points from the edge (`WHEEL_CENTRE_INSET` in `Deck.tsx`), so "Effort" has room for one line; `Silk` labels also have `numberOfLines={1}`. A first try, a 60-point label overhanging a 40-point column, was cut to "EFFO…" on the web, because React Native Web limits one-line text to its parent's width. Checked in the web view: the label is 41 points wide on one line, the pill is 37 × 125 centred at y 201. Phone screenshot from the user (iPhone 17, Expo Go): "EFFORT" is on one line, about 820 to 865 points across; the pill measures about 37.5 × 125, from x 13.5 to 51 and y 138.5 to 263.5, which matches the measured cutout to within a point. The screenshot does not show the real cutout (no call was running), so the user checked by eye on the phone: the pill and the cutout match 1:1, with no border.
- **Do:** stop the "Effort" label wrapping, and set the island pill's margin from the T1 measurements.
- **Done when:** checked in the T2 view and confirmed by the user on the phone.

### T5. Choose how to draw glass and glow (done 2026-11-13)
- **Choice:** **Liquid Glass "clear" tinted 25% black** (`glassEffectStyle="clear"`, `colorScheme="dark"`, `tintColor="rgba(0,0,0,0.25)"`, sample T1). First round: the user ranked C2 (clear), C1 (regular), D (Skia). They then found C1 easier to read but "a little too milky and diffuse", and plain C2 let the glow wash out the legend, so a second round tried C2 tinted black at 25%, 45% and 65%. The user liked the "glossy heaviness" of 25% and would accept C1 too; 25% was chosen, C1 is the runner-up. At 65% the white glow almost vanished. They suggested a later theme setting to switch between C2, C1 and D; it is in the brief as an idea under open decisions (7), not a requirement. The brief's N-5 now says this. Open: what older iPhones and Android show, since `GlassView` falls back to a plain view there; D runs everywhere and was ranked third.
- **Phone screenshot (iPhone 17, Expo Go):** the readout said "glass API available, Liquid Glass on". C2 bends the glow towards the cap's edges and lights its rim, which neither the web nor the mockup can show. **Bug in D:** the white-lit Skia key drew no glow at all on the phone (a black cap), while the green one did, and both work on the web. Not investigated; fix it before D is used as a fallback or theme.
- **Work done:**
  - **From live docs (Expo SDK 58 reference pages):** `expo-glass-effect` (~58.0.5), `expo-blur` (~58.0.6) and `@shopify/react-native-skia` (2.14.0) are all included in Expo Go, so none needs a development build. `GlassView` is Apple's Liquid Glass, iOS 26 and later only; elsewhere it falls back to a plain `View` (no Android, no web), and the docs say to check `isGlassEffectAPIAvailable()` first and not to set opacity below 1 on it or its parents. `BlurView` works on iOS, Android and web, but on Android it needs a `BlurTargetView` and `blurMethod`, and it ignores `borderRadius` unless it clips (`overflow: 'hidden'`). Skia on the web needs CanvasKit: `pnpm --filter mobile setup-skia-web` copies `canvaskit.wasm` into `apps/mobile/public` (ignored by git), and `WithSkiaWeb` loads it. React Native's own `filter: blur()` is Android only, so the plain options draw the glow as a `radial-gradient` background instead (documented in React Native's view style props).
  - **Samples:** `apps/mobile/src/materials/` draws the same number key five ways, each lit green and white: A plain (gradient glow under a see-through cap, no library), B `expo-blur`, C1 Liquid Glass "regular", C2 Liquid Glass "clear", D Skia (a real 14-point blurred glow and a backdrop blur, like the mockup's CSS); round 2 added T1 to T3, clear glass tinted black at 25%, 45% and 65%. `SHOWN` in the file picks the five columns on screen. `SCREEN` in `App.tsx` is back on `'deck'`; set it to `'materials'` to see the samples again. Keep them until T6 has used them, then delete the folder.
  - **Checked in the web view:** all five render with no console errors. C1 and C2 show no glass there (expected). The user judged them on the phone.
  - **Install note:** `pnpm add` failed twice with "failed to rename staging directory" while the `deck-web` server was running; it worked once the server was stopped. Stop Metro servers before installing.
- **Do:** from live documentation, find which of these work in Expo Go and which need a development build: Expo's glass-effect library (Apple's real Liquid Glass), `expo-blur`, and a drawing library such as React Native Skia. Build one number key each way that is practical, with its coloured glow lit, and compare with the mockup.
- **Done when:** the user has picked one from screenshots. Note for them: glass only looks like glass with something behind it, and in the mockup most of that comes from the glow under lit keys.

### T6. Restyle the deck to match the mockups
- **Do:** apply the choice from T5 (Liquid Glass "clear" tinted 25% black, sample T1 in `src/materials/Materials.tsx`) to every key, add the glow and lit states behind a temporary demo switch, and add the plate grain if it can be done cheaply.
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

To see the app in a browser beside a mockup, see T2 (`deck-web` and `mockups` in `.claude/launch.json`, and `design/mockups/make-compare.ps1`).

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
