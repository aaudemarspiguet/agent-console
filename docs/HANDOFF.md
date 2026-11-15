# Handoff: state of the project on 2026-11-13

Read this with [product-brief.md](../product-brief.md) (version 15), which holds the requirements. This file holds where the work stands, what is wrong, and the tasks in order.

## What the product is

A free iPhone app that sits beside the keyboard as a "deck" for coding agents, with a tray agent on the Windows PC. The phone shows every agent session, answers permission requests with a key press, and replies by voice. Requirement IDs such as K-2 or E-5 refer to the brief.

## Where things are

| Path | What it is | State |
|---|---|---|
| `product-brief.md` | Requirements, trade-offs, feasibility research | Current (version 15) |
| `competitor-research.md` | Earlier research on similar products | Reference |
| `apps/mobile` | The phone app: Expo SDK 58, React Native 0.88, TypeScript | Runs in a development build on the iPhone (T10) and in Expo Go; one screen; does not match the design yet |
| `apps/agent` | The PC side: a Node script | Gate 0 spike: QR pairing, encrypted WebSocket link, Claude Code hook endpoints (T8) |
| `packages/protocol` | Code shared by phone and PC | Message shapes and the encrypted channel (T8) |
| `design/mockups` | The design boards (HTML) and the scripts that generate them | Current design, drawn at the wrong phone size |
| `design/saved-keycaps-v1` | An older design, kept for reference | Superseded |
| `spike/console-typing` | Scripts that proved the effort-wheel route | Working test scripts, not product code; G0-5 done (T9) |
| `spike/connection` | Notes and a playground project for the connection spike | T8; the code itself is in `apps/` and `packages/` |

## Decisions already made (do not reopen without the user)

- **Stack:** one codebase in React Native with Expo, for iPhone now and Android later (stretch goal S5). No separate native apps and no Mac. Keep the code free of iOS-only libraries where a cross-platform one exists.
- **Package manager:** pnpm, as one workspace. Use `pnpm exec expo install <package>` for Expo libraries so versions match the SDK.
- **Builds:** development builds made by Expo's cloud service (EAS), signed with the user's paid Apple Developer account (team WQ4328BM62). The first one was installed on 2026-11-13 (T10). Expo Go still works for screens that use no library outside it.
- **Bundle identifier:** `dev.amoghmade.agentconsole`, from the user's domain `amoghmade.dev`. Registered with Apple, so it cannot change without starting again as a new app. It does not depend on the product name.
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
  - **Samples:** `apps/mobile/src/materials/` draws the same number key five ways, each lit green and white: A plain (gradient glow under a see-through cap, no library), B `expo-blur`, C1 Liquid Glass "regular", C2 Liquid Glass "clear", D Skia (a real 14-point blurred glow and a backdrop blur, like the mockup's CSS); round 2 added T1 to T3, clear glass tinted black at 25%, 45% and 65%. `SHOWN` in the file picks the five columns on screen. `SCREEN` in `App.tsx` is back on `'deck'`; set it to `'materials'` to see the samples again. Kept after T6 at the user's request, as a record of the options; see `src/materials/README.md`.
  - **Checked in the web view:** all five render with no console errors. C1 and C2 show no glass there (expected). The user judged them on the phone.
  - **Install note:** `pnpm add` failed twice with "failed to rename staging directory" while the `deck-web` server was running; it worked once the server was stopped. Stop Metro servers before installing.
- **Do:** from live documentation, find which of these work in Expo Go and which need a development build: Expo's glass-effect library (Apple's real Liquid Glass), `expo-blur`, and a drawing library such as React Native Skia. Build one number key each way that is practical, with its coloured glow lit, and compare with the mockup.
- **Done when:** the user has picked one from screenshots. Note for them: glass only looks like glass with something behind it, and in the mockup most of that comes from the glow under lit keys.

### T6. Restyle the deck to match the mockups (done 2026-11-13)
- **Result:** confirmed by the user on the phone after three rounds of screenshots (iPhone 17, Expo Go). Built on branch `feat/glass-glow-tuning`.
  - **Number keys** (`Key.tsx`) are a `GlassView`, "clear", dark, tinted `rgba(0,0,0,0.25)`, clipped to the cap's 10-point corners, with the mockup's lift shadow. Under the glass sits the mockup's pale face (a white gradient, 15% to 8%). `GLASS` is checked once with `isGlassEffectAPIAvailable()` on iOS; without it (web, older iPhones, Android) the cap has the mockup's gradient finish and border instead, a stand-in until the fallback is decided.
  - **Glow:** a lit number key draws a radial gradient under its cap, and its dot lights in the same colour (white 0.32, green and amber 0.8, the mockup's strengths). Under glass the glow is 0.7 of that, a smaller ellipse (28% in from each side), and centred on the cap; without glass it is the mockup's size.
  - **Unlit keys (K-3):** a key that does nothing has its legend at 30% white; Allow turns the mockup's darker blue.
  - **Plate grain** (`Deck.tsx`): a 1-point line at 2.8% white every 3 points, one hard-edged `linear-gradient` tiled with `backgroundSize` and `backgroundRepeat`. React Native's docs (0.88) list only linear and radial gradients, so the mockup's `repeating-linear-gradient` is not used. It shows on the phone.
  - **Demo switch:** `DEMO_LIGHTS` in `src/lights.ts` (temporary), set to `'atRest'`. `'atRest'` copies board "1 · At rest" (1, 4, 6 white; 2 green; Link on; deny, allow, always allow, cancel, send unlit), `'request'` copies board 3 (1 amber, Request on, answer keys lit), `'off'` is the real state with nothing connected. Remove the switch when sessions are connected; `NOTHING_CONNECTED` stays as the default.
- **Decisions, from the user's phone screenshots:**
  1. **First build, the mockup's glow under the glass:** the glass spreads the glow to the cap's edges and lights its rim, so a lit key read as a lit tile (green most of all, and the "2" was hard to read). Unlit glass keys were nearly black, darker than the solid keys, because the tinted glass had nothing pale under it.
  2. **Half-strength, smaller glow, plus the pale face under the glass** (shown beside the first build, keys 1 to 3 against 4 to 6): the face fixed the black unlit key, which now matches the solid keys. The white glow was too faint, and the glow sat below the number.
  3. **0.7 strength, centred on the cap:** chosen by the user ("I like the tuned settings"). Known, accepted: the glass still pulls a little of the glow to the cap's top and bottom edges, an hourglass shape most visible on green. A shorter glow might reduce it; not tried.
- **Checked in the web view (874 × 402):** "At rest" and "request" render with the right keys lit and unlit, compared by eye with boards Island1 and Island3. Type check passes. Expected differences from the board: no glyphs or small labels ("session", "hold to talk"), which wait for T7; the island and wheel are on the other side (web orientation, see T2); the web shows the stand-in finish, not glass.
- **Not checked:** the final single-version build was not viewed on the phone after the comparison switch was removed; it is the tuning the user saw on keys 4 to 6. The "request" lights (amber) were only seen on the web.
- **Still open:** the reduced-transparency fallback in the mockups (`prefers-reduced-transparency`) is not built; `AccessibilityInfo.isReduceTransparencyEnabled()` is the check the Expo docs point to. What older iPhones and Android show (N-5).
- **Samples kept:** `src/materials/` stays, by the user's choice, as the record of the T5 options and for the theme idea (brief, open decision 7). See its `README.md`.
- **Do:** apply the choice from T5 (Liquid Glass "clear" tinted 25% black, sample T1 in `src/materials/Materials.tsx`) to every key, add the glow and lit states behind a temporary demo switch, and add the plate grain if it can be done cheaply.
- **Done when:** the T2 view matches the redrawn mockup board "1 · At rest", and the user confirms on the phone.

### T6b. Make key presses feel heavy (done 2026-11-13)
- **Choice:** variant **A heavy**, on every key. The user tried the four on the phone and picked "whatever run tests button uses", which was A: in the compare build, every key other than 1 to 6 used A. The brief's K-4 records it. `PRESS_FEEL` and the other variants were removed from `src/pressFeel.ts`; the table below keeps their values in case the feel is revisited.
- **From live docs:**
  - **`expo-haptics` (SDK 58 reference):** `impactAsync` takes one of five fixed styles: Light, Medium, Heavy, Rigid and Soft. On iOS these map straight to `UIImpactFeedbackStyle`. There is no intensity or pattern setting, so the only ways to change the feel are the style and timing two pulses with a delay. iOS does nothing in Low Power Mode, when the Taptic Engine is off in settings, or while the camera or dictation is on.
  - **Custom patterns:** for custom patterns, Expo's page points to the Pulsar haptics SDK (docs.swmansion.com/pulsar). Not fetched or tried: whether it runs in Expo Go is unknown, and it most likely needs a development build.
  - **Movement (React Native 0.88 `Animated`):** `spring` takes stiffness, damping and mass, and `timing` takes a duration and an easing. The native driver supports `transform`, but not `boxShadow`.
- **Built:**
  - **Where:** `src/pressFeel.ts` holds the feels. `Key.tsx` now uses a `Pressable` with an `Animated.View` cap that moves by `translateY`. The cap's shadow switches to its pressed form while the cap is more than halfway down, read through a listener on the animated value.
  - **Comparison build (removed after the choice):** the temporary `PRESS_FEEL` switch, set to `'compare'`, gave each number key its own feel: 1 current, 2 A, 3 B, 4 C, then 5 A and 6 B again. Every other key used A.

    | Variant | Press | Second pulse | Release | Drop | Return |
    |---|---|---|---|---|---|
    | current | Medium | none | none | 2 pt | snaps back |
    | A heavy | Heavy | none | Soft | 3 pt | spring, about 0.7 s, rises 0.4 pt past rest once |
    | B gluunk | Rigid | Soft, 70 ms later | Light | 3.5 pt | eased over 320 ms, no bounce |
    | C deep | Heavy | Heavy, 90 ms later | Soft | 4 pt | spring, about 1 s, no bounce |
- **Checked:**
  - The type check passes.
  - "current" moves 2 points in the web view.
  - The return times and overshoot above come from simulating the spring settings, not from watching them. The browser pane drew only one animation frame in 800 ms, so the springs could not be watched there.
- **Not checked:** the final build, with A on every key and the switch removed, was type-checked but not tried on the phone. The code was simplified, but the values are the ones the user felt on "run tests".
- **Goal:** a press should feel deep, like a heavy glass key going down and coming back slowly: a "gluunk", not a click. Today a press is one `expo-haptics` medium impact and a 2-point drop that snaps back (`Key.tsx`).
- **Do:** from live documentation for the installed versions, find what can shape the feel in Expo Go and what needs a development build: `expo-haptics` (impact styles, and whether two pulses on press and release can be timed), Apple's Core Haptics for a custom pattern (likely a library and a development build), and a spring or slow timing for the cap's return (React Native's `Animated`, or Reanimated). Try a few versions: a firmer press-in haptic, a softer one on release, a deeper drop, a slow damped return. Put them behind a temporary switch like `SCREEN`, so the user can feel each one on the phone.
- **Done when:** the user has picked one by feel on the phone, it is applied to every key, and K-4 in the brief says what was chosen. Haptics cannot be checked on the web; only the movement can.
- **Order:** after T6, which restyles the cap the press moves; it can run before T6 if the user prefers.

### T6c. A colour for each session state (done 2026-11-13, asked by the user)
- **Choice:** six states, each with its own colour, agreed with the user (the brief's A-3 has the table and the hooks behind each state). The user pointed to another deck's coloured status keys as the idea; the colours here are Apple's system colours, not that deck's pastels.
  - **Thinking** blue `#64D2FF`
  - **Running** white
  - **Needs approval** amber `#FF9F0A`
  - **Finished** green `#30D158`
  - **Error** red `#FF453A`
  - **Idle** unlit
- **From the hooks docs (code.claude.com/docs/en/hooks):**
  - **Running** is the time between PreToolUse and PostToolUse or PostToolUseFailure.
  - **Thinking** is the rest of a turn. No hook fires when the model starts or stops writing.
  - **Needs approval:** PermissionRequest fires at once. The Notification hook with `permission_prompt` only fires after about 6 seconds.
  - **Error:** StopFailure fires "when the turn ends due to an API error", in place of Stop.
  - **Interrupts:** Stop does not fire when the user interrupts a turn, so the PC agent needs some other way to clear a stale Thinking or Running state. That way is open.
- **Built:**
  - **App:** `src/lights.ts` has the five lit states and their glow strengths. Blue (0.6) and red (0.8) were set by eye and are not yet checked on the phone. `DEMO_LIGHTS` gains `'states'`, which puts all six on keys 1 to 6. `'atRest'` now matches the redrawn boards.
  - **Mockups:** `gen-island.ps1` changes key 4 to Thinking (blue) and key 5 to Error (red) on every board. The session list (Island2) shows rows for Running, Finished, Idle, Thinking and Error, with new icons for Thinking (three dots) and Error (a cross). All 17 boards were regenerated with no `@@` left, and the canvas was republished as version 47 after checking that the live files matched the last commit.
- **Checked:**
  - In the web view, the `'states'` demo shows all six states.
  - Local copies of boards Island1 and Island2 were looked at.
  - The type check passes.
- **Not checked:** the colours through the glass on the phone, and the canvas render itself.

### T6d. Matte keyboard finish for the other keys (done 2026-11-13, asked by the user)
- **Ask:** the keys other than the session keys "shouldn't be glass. They ought to be more like keyboard keys. think mac. so a matted aluminum type or like a mechanical keyboard material". They were never Liquid Glass; their glossy gradient and bright top line read as glass.
- **Tried, side by side on the deck:** Mac matte; bead-blasted space-grey aluminium (lighter, fine grain, bright top bevel, dark bottom bevel); a PBT mechanical keycap (dark skirt around a smaller dished top face with a rough texture).
- **Chosen: Mac matte**, for every action key and for Allow in blue (lit and unlit). Values are in `lookStyles` in `src/Key.tsx` and in `.key.solid` and `.key.tint` in `design/mockups/gen-flow.ps1`; the phone boards were regenerated. Brief N-5 updated (version 11).
- **Checked:** web view and type check. **Not checked:** on the phone.

### T7. Decide legends and glyphs (done 2026-11-13)
- **Chosen by the user** from a side-by-side of three options (words only; glyphs on wide keys only; glyph and word everywhere at 11 points):
  - **Legends:** words at 13 points on every action key.
  - **Glyphs:** only on the wide keys: Deny (cross), Allow (check), Redirect (microphone), Send (up arrow), 15 points, above the word on the same side.
  - **Hints:** Redirect keeps "hold to talk" in the opposite corner. Always Allow loses "session"; its spoken label still says it.
- **Where:** `glyph` and `hint` in `src/layout.ts`, drawn by `src/Glyph.tsx` with `react-native-svg` 15.16.0 (in Expo Go, per the SDK 58 docs). Glyph, hint and legend share one ink and dim together when the key is unlit. Mockups: the glyphs on single-cell keys and the 11-point override for the four-row grid were removed from `gen-island.ps1` and `gen-flow.ps1`, and every phone board was regenerated. Brief K-2 updated (version 10).

### T8. Gate 0 spike: the connection (done 2026-11-13)
- **Built:**
  - **Agent** (`apps/agent`, `pnpm agent`): a QR code to pair, an encrypted WebSocket link on port 8765, and Claude Code hook endpoints on 127.0.0.1:8766.
  - **Protocol** (`packages/protocol`): the message shapes and the encrypted channel.
  - **Phone:** a plain test screen (`apps/mobile/src/link`). Shown when `SCREEN` in `App.tsx` is `'link'`.
  - **New libraries:**
    - phone: `expo-camera` ~58.0.14 and `expo-crypto` ~58.0.8, both in Expo Go per the SDK 58 docs;
    - protocol: `@noble/ciphers` and `@noble/hashes` 2.4.0, pure JavaScript;
    - agent: `ws` 8.23.0 and `qrcode-terminal` 0.12.0.
  - **Design:** `spike/connection/README.md`.
- **From live docs:**
  - **Claude Code hooks page:**
    - `type: "http"` hooks POST the event's JSON. The default timeout is 600 s.
    - A connection failure, a non-2xx reply or a timeout is a non-blocking error unless `onFailure: "block"` is set.
    - PermissionRequest answers with `hookSpecificOutput.decision`: `behavior` allow or deny, plus `message` or `interrupt` on a deny and `updatedPermissions` on an allow.
  - **Expo SDK 58 docs:**
    - `expo-crypto` has random bytes, digests and AES-GCM, but no key exchange.
    - React Native has no global WebCrypto, hence the noble libraries.
- **Tested (details in the brief, "Tested on this PC: the connection"):**
  - The web build stood in for the phone.
  - Real headless Claude Code sessions in `spike/connection/playground` sent the requests.
  - These worked:
    - pairing and the encrypted link;
    - refusing a wrong key, a replayed frame and the wrong PC;
    - reconnecting after the agent restarted;
    - Allow, and Deny with a message that changed what Claude did next;
    - a queued follow-up through the Stop hook (`additionalContext` is used, because `decision: "block"` is labelled an error);
    - a timeout, which is denied when headless.
  - The type check passes.
- **Done with the user on the iPhone 17 (Expo Go):** the phone linked over Wi-Fi. In an interactive terminal session, Allow from the phone ran the command ("Allowed by PermissionRequest hook"), and a queued follow-up arrived as "Stop hook feedback". A 60-second timeout cleared the phone and the request fell back to the terminal, where the user approved it. Neither Windows Firewall nor iOS asked for permission on the first link. The terminal's own prompt shows at the same time as the phone, so either can answer first.
- **Found and fixed with the user:** answering in the terminal first did not clear the phone, because Claude Code keeps the hook open until its timeout. The agent now clears it on the session's later hooks (`/hooks/event`); the user confirmed on the phone that it clears.
- **No phone linked:** with the app closed, the agent returned no decision and the terminal asked at once (confirmed by the user).
- **Open, for the user:** whether to try a channel (research preview) beside or instead of the hooks: it can push messages mid-turn, which hooks cannot. See the brief's connection results.
- **After:** `SCREEN` in `App.tsx` is back on `'deck'`; set it to `'link'` to use the test screen again. The deck's keys are not wired to the link yet; that belongs with Release 2 (A-1 to A-3).
- **Done when:** the three gate items are demonstrated on the phone and their results are written into the brief's feasibility section.

### T9. Finish the effort-wheel tests (done 2026-11-13, with the user at the PC)
- **Result:** the full results are in the brief ("Tested on this PC", second round) and in `spike/console-typing/README.md`. E-5 and E-7 were changed to match (brief version 13). In short:
  - **Finding the process:** the owning process of the HTTP hook's TCP connection is the session's `claude.exe`, the one to attach to. Worked for headless, interactive and elevated sessions.
  - **Current effort:** `effort.level` is in the hook input on PreToolUse, PostToolUse and Stop, but not on UserPromptSubmit or Notification. A SessionStart HTTP hook never fired. The level also shows above the prompt box.
  - **Elevated terminal:** the agent cannot attach (error 5). The session's hooks still arrive, so it can be listed with the wheel unlit.
  - **The user typing at the same time:** with separate writes, the user's letters got between Ctrl+S and `/effort` every time, and Enter sent them to the model as prompts (three stray Haiku turns, in the test session only). With Ctrl+S, `/effort` and Enter as one write, nothing stray was sent. Keys typed while the slider is open are still swallowed, and one change in three was lost. So the agent must wait for the box to go still (E-7).
  - **Stash state:** the "stashed" marker shows a stash exists, and the stash holds only one draft. The cursor column tells a draft from an empty box unless the cursor is at the start of the draft. Colours read as plain grey, so they cannot help.
  - **New hazard:** Enter on the slider and `/effort <level>` both save a new default to `~/.claude/settings.json`. Only `s` is session-only. See "Traces" below.
- **Added:** `spike/console-typing/step.ps1`, the batched step.
- **Checked:** every result above was read off the session's screen or the hook log at the time. **Not checked:** Ctrl+S on an empty box with no stash; a multi-line draft; the timing of a real agent (the spike takes about a second for each write); how long the box must be still before sending; SSH, WSL, Codex, Cursor's agent, Antigravity.
- **Do:** the items still open under G0-5: an elevated terminal (needs a UAC prompt answered), the user typing at the same moment, how the PC agent finds a session's process from its hooks, whether a hook reports the current effort level, and whether the prompt box's stash state can be told before Ctrl+S is sent.
- **Use:** `spike/console-typing`. Read its README first; it types into real sessions.

### T10. First development build (done 2026-11-13, with the user)
- **Result:** the app runs on the user's iPhone 17 as a development build, loading from the PC's dev server over Wi-Fi.
  - **Accounts:** Expo account `amogh0000` (personal; the user also owns `amogh0000s-team`, unused). EAS project `@amogh0000/agent-console`, id in `app.json` under `extra.eas.projectId`. Apple team WQ4328BM62.
  - **Config:** `ios.bundleIdentifier` in `app.json`; `apps/mobile/eas.json` with Expo's default `development` (dev client, internal distribution), `preview` and `production` profiles. During the build EAS also wrote into `app.json`: the iOS microphone and speech texts under `ios.infoPlist` (copied from the plugin settings), `ITSAppUsesNonExemptEncryption: false` (the user answered that the app only uses standard encryption), and Android camera and microphone permissions.
  - **Credentials:** the Apple distribution certificate and the ad hoc provisioning profile were made by EAS and are stored on Expo's servers. The iPhone (UDID 00008150-000104C93C45401C) is registered for internal distribution. EAS keeps an Apple sign-in session at `~/.app-store/auth/`.
  - **The first `device:create` failed** with "no team associated with your Apple account", minutes after the user enrolled. The same command worked about ten minutes later with nothing changed, so it was most likely Apple's systems catching up.
  - **The cloud build** took about 5½ minutes, Skia's native code included.
- **How:** `pnpm dlx eas-cli@latest <command>` from `apps/mobile` (eas-cli 27.9.0 was used; not installed globally). pnpm's `dlx` asks once which of eas-cli's packages may run build scripts (`dtrace-provider`, `protobufjs`): press Enter with none ticked. The phone camera could not read the terminal's text QR codes reliably ("No usable data found"); open the build's expo.dev link in Safari, and in the app pick the dev server from the list or type `http://<PC address>:8081`.
- **Checked:** the deck showed on the phone (the user's word). **Not checked:** whether the development build honours the landscape lock that Expo Go ignored; speech recognition, the camera and haptics inside the build; whether the look differs from Expo Go.
- **Open:** EAS warns that `cli.appVersionSource` in `eas.json` will be required in future; not set yet. A new native library or a change to `app.json` needs a new build (`eas build --platform ios --profile development`); JavaScript changes do not.

### T11. Give the keys a "creamy" sound (sound, loudness and ringer behaviour done 2026-11-13; a few checks open)
- **Found (2026-11-13, from live docs and the installed code):**
  - **Library:** `expo-audio` 58.0.12, installed. Its SDK 58 page says it is included in Expo Go. It needed a new development build (see below). No config plugin was added: its options cover background playback and recording, which the keys do not need.
  - **What the iPhone keyboard does:** Apple's docs for `playInputClick` say it plays "the standard system keyboard click", only from a custom input view adopting `UIInputViewAudioFeedback`, and only if the user has keyboard clicks on in Settings. So it cannot play a custom sound, and is not for ordinary buttons. No public way to read the Keyboard Feedback setting was found. Community reports (not Apple docs) say keyboard clicks are muted by the Silent switch, follow the ringer volume rather than the media volume, and keep playing alongside music. Not yet checked on the phone.
  - **Audio session:** `setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' })`. In expo-audio's iOS code this sets the `ambient` category. Apple documents `ambient` as silenced by the Silent switch and screen lock, and mixed with other apps' audio. It does not duck the music. **The known gap:** it plays at the media volume, not the ringer volume. Matching the ringer volume would need `AudioServicesPlaySystemSound`, which Apple says plays "at the current system audio volume" with custom .caf, .aif or .wav files under 30 seconds. That needs a small native module and a new build; not done.
  - **Possible clash, untested:** speech recognition (Redirect) will change the audio session while listening. The key-sound mode may need setting again afterwards.
- **Built:**
  - **Synthesized sounds, tried and dropped (2026-11-13):** two rounds of sounds synthesized by a script: first a sine body with noise, then resonances excited by a noise burst and tuned towards the QK65 Mk3. On the phone the user found them "too toy like". The script was deleted.
  - **Recorded sounds (2026-11-13):** real keyboard recordings from the sound packs of **Thock** (github.com/christophervistal25/thock, commit 8eb6309), an open-source Linux key-sound app. Its maintainer sliced each recording into press and release, resampled it to 48 kHz mono and level-matched it. Four CC0 packs were tried on the phone: **Rainy 75** (an aluminium, gasket-mounted board with foam, the closest build to the QK65 Mk3), Thocky, Smooth Linear (Keychron K10) and Topre (HHKB). **The user chose Rainy 75** by ear. The other three were deleted. Its takes v0 to v5, press and release (12 files), are in `sounds-src/rainy-75/` as downloaded (not bundled). Each take is 70 to 120 ms and starts within about 2 ms. Thock's other packs were not taken: Buckling Spring is GPL-2.0, Coding Relax is personal use only, and the rest do not fit "creamy".
  - **Licence:** `assets/sounds/LICENSES.md` names the Freesound source, "Typing on a rainy 75" by Techrul. It is CC0 according to Thock's `SOUNDS-LICENSES.md`, which says the maintainer checked the source page on 2026-11-03. **Not re-checked by us:** Freesound could not be reached from this PC's tools on 2026-11-13. Check the page before release.
  - **Playing:** `src/keySound.ts`. There is one player per take, made when the app starts. A press plays a random ready take, not the one just played, so the sound never repeats exactly. A player rewinds itself as soon as it finishes, so a press only calls `play()`. If every take is still sounding, the oldest restarts. **Fixed (the user, 2026-11-13):** the first version had one player per sound and rewound it at the moment of the press. `seekTo` is asynchronous, so a quick second press often played nothing.
  - **Sound, haptic and movement together (the user, 2026-11-13, in two steps):** at first, the release sound played the moment the finger lifted, about 0.27 s before the slow spring brought the key back. The second version fired sounds when the cap's animated value reported reaching the bottom or the top. On the phone those reports came late or not at all. Clicks arrived after the user had stopped, and spammed keys stayed down and silent. **Now (`src/pressFeel.ts`) nothing waits on the animation:**
    - **Press:** the sound and haptic fire on touch. The cap drops in 30 ms (was 60), so it is seen landing with them.
    - **Release:** a stiffer spring (stiffness 722, damping 26.9, mass 1, damping ratio 0.5) brings the cap to the top in 90 ms, overshoots about 0.5 points, and settles by about 0.3 s. It used to take 0.7 s. A spring released from rest takes the same time to reach the top whatever depth it starts from, so a 90 ms timer fires the return sound and Soft haptic as the cap arrives. A new press on that key cancels the timer.
    - **Spamming:** each stroke starts from wherever the cap is, so a spammed key visibly jitters, with a sound on every press. The user asked for this ("on a keyboard you visually see that jitter").
  - **Ringer volume and loudness (the user, 2026-11-13):** the user asked that the keys follow the ringer volume, not the media volume, and that their peak loudness match the iPhone keyboard's. (The user first asked to "dampen the resonance". A tail fade was tried, then dropped the same day when the user corrected this to limiting the peak volume.) `expo-audio` always plays at the media volume, so on iOS the keys now play through **System Sound Services**. This uses a local Expo module, `modules/key-click`: Swift `KeyClickModule`, iOS only, autolinked from `modules/`. Its `load(key, fileUrl)` registers a file with `AudioServicesCreateSystemSoundID`, and `play(key)` calls `AudioServicesPlaySystemSound`. Its `playKeyboardClick()` plays system sound 1104, which is widely used for the keyboard click but not documented by Apple.
    - **What Apple documents** (AudioServicesPlaySystemSound page, read 2026-11-13): sounds play "at the current system audio volume, with no programmatic volume control available"; "Sounds play immediately"; "Simultaneous playback is unavailable: You can play only one sound at a time"; files are linear PCM or IMA4 in .caf, .aif or .wav, at most 30 seconds. By default (`kAudioServicesPropertyIsUISound` = 1) a system sound "respects the user setting in the Sound Effects preference". Apple's pages do not say that "system audio volume" means the ringer volume, or whether the Silent switch mutes these sounds. **Checked on the phone (the user, 2026-11-13): the keys follow the Ringer and Alerts volume, and are silent with the Silent switch on.**
    - **Loudness built into the files:** there is no volume control, so `scripts/make-key-sounds.mjs` writes each original take from `sounds-src/rainy-75/` at 28, 32 and 36 dB down, into `assets/sounds/rainy-75/m<dB>/`. That is 36 files, 428 KB. Earlier sets, at 0 to 20 dB down and then 16 to 44 dB down, were used for the loudness comparison. It also generates `src/keySoundFiles.ts`, which requires them. At start-up `keySound.ts` copies each file to a local path with expo-asset (`Asset.fromModule(...).downloadAsync()`, now a direct dependency) and registers it.
    - **Strength on iOS:** a lighter press plays the next level, 4 dB quieter (strength under 0.8), or 8 dB quieter (under 0.6). It cannot change pitch, because system sounds have no rate control. The expo-audio path keeps volume only; the pitch change was dropped there too, for simplicity.
    - **Loudness chosen (the user, 2026-11-13):** compared by ear on the phone against the iPhone keyboard's own click, played on key 1 as system sound 1104. Rainy 75 at 0 to 16 dB below the recording was all "way louder". At 20 to 36 dB down, the user chose **28 dB down**: "still louder but i like its level". Lighter presses play 32 dB down (strength under 0.8) or 36 dB down (under 0.6). The comparison and `playKeyboardClick` were removed from the JavaScript and the Swift. The installed build (03f2d444) still has that unused native function; the next build drops it.
    - **Android and the web** keep `expo-audio`, with the ambient audio mode and fast typing smoothing.
    - **Third development build** (native code): built 2026-11-13 in about 4 minutes (build 03f2d444), installed on the phone. The keyboard click on key 1 plays (the user).
  - **Fast typing smoothing (the user, 2026-11-13; expo-audio path, so Android and the web; on iOS, system sounds play one at a time anyway):** modelled on a desktop key-sound app's setting of that name ("Reduces overlapping sounds for more pleasing feedback during rapid typing"). In `src/keySound.ts`, each new key sound fades out anything still ringing, on any key, over 24 ms in three volume steps. It then pauses and rewinds that sound. Measured on the web with alternating presses on two keys every 100 ms: nothing is left playing afterwards, and sounds overlap only inside those 24 ms fades.
  - **Strength (the user, 2026-11-13: repeated presses should "physically sound diff and look diff then a singular slam"):** the screen cannot sense force, so strength comes from the time since the key was last pressed. 450 ms or more is full strength (1). 90 ms or less is the lightest (0.45). In between it is linear. Strength sets three things. The depth runs from 60% to 100% of 3 points. The haptic is Heavy at 0.8 and above, Medium at 0.6 and above, and Light below that. The sound's volume runs from 0.4 to 1, and lighter presses play up to 8% faster with pitch correction off ("varispeed" on iOS), so they are slightly higher and shorter. How long the finger is held is not used, beyond the quick-tap rule.
  - **Comparison switch:** removed once Rainy 75 was chosen.
- **Checked:** the type check passes. A simulation of the spring gives the first arrival at the top at 90.0 ms and an overshoot of 0.49 points. In the web preview, sampled every frame: the press sound starts in the frame the cap starts to move. The return sound starts in the frame the cap reaches the top (355 ms against 356 ms). Spamming shows the cap bouncing between about 1.7 and 0.1 points down, shallower than a full press. The user chose Rainy 75 on the phone. **Not checked:** the new timing, jitter and strength on the phone. Also not checked: the Silent switch, music and volume behaviour. On the web a press registers about 60 ms after the mouse goes down, so web timings start late; that delay was already there.
- **Reference keyboard (the user, 2026-11-13):** the Qwertykeys **QK65 Mk3**. The maker describes a PCB gasket mount, an "acoustic chamber", two case foams, plate foam and PET and IXPE sheets. Stock switches are Oat linears with Cherry-profile PBT keycaps. No recording of it with a usable licence was found, and the user has no board to record.
- **Second development build:** made 2026-11-13 to add `expo-audio`, in about 8 minutes (build 60f7d6df). It is installed on the phone and works (the user). An older build shows "Cannot find native module 'ExpoAudio'".
- **Note:** `make-key-sounds.mjs` deletes and rewrites the sound folders. A running Metro may then fail to find the new files, as the web preview server did. Restart that server if it does.
- **Still open:** whether a new press cuts off the previous system sound or waits for it (Apple says only one plays at a time); playing over music; re-checking the Freesound licence page; whether there should be an in-app setting to turn the sound off. If the feel needs more work, the user tries the timing and strength on the phone and tunes them (`DOWN_MS`, `TOP_MS`, `DAMPING_RATIO`, `QUICK_MS`, `FULL_MS`, `LIGHTEST`, `SHALLOWEST` in `pressFeel.ts`, and `QUIETEST`, `MAX_SPEED_UP` in `keySound.ts`). Then check the Silent switch and music on the phone, and the licence page.
- **Goal, in the user's words:** "Creamy: Smooth, cushioned, deep, and slightly thuddy acoustic signature." This is the sound that goes with the heavy press from T6b; the brief's K-4 records it.
- **Do:**
  - **Library:** from live documentation, find which Expo library plays short sounds with low enough delay to feel tied to the press (likely `expo-audio`), and whether it runs in Expo Go.
  - **Behave like the iPhone's own keyboard clicks (decided by the user, 2026-11-13):** whatever iOS does with keyboard click sounds, the keys do the same. That covers the ringer or silent switch, music playing in the background (whether the click plays, and whether it ducks or stops the music) and the volume it plays at. First confirm from Apple's documentation and on the phone what the keyboard actually does; do not go by memory. Then set the audio session to match. Also check whether an app can follow the user's Keyboard Feedback sound setting, for example through Apple's input-click API (`UIDevice.playInputClick`), and whether Expo Go allows it.
  - **Sounds:** find or record a few candidate sounds. They must be licensed for use in an app or made for it. Keep them short and quiet.
  - **Try them:** play the sound on press, and perhaps a softer one on release, timed with the T6b haptics. Put a few candidates behind a temporary switch, as in T6b, so the user can choose by ear on the phone.
- **Done when:** the user has picked one on the phone, it plays on every key, and K-4 says what was chosen. The web can play sound, but its timing and the phone speaker differ; judge on the phone.
- **Open, for the user:** whether there should be an in-app setting to turn the sound off. The brief does not list one. If the keys can follow the iPhone's own Keyboard Feedback setting, that may answer it.

### T12. Make the effort wheel turn, and look and feel physical (done 2026-11-14)
- **Feel chosen (the user, 2026-11-14, on the phone): C notch.** `WHEEL_FEEL` in `src/wheelFeel.ts` holds its values; A and B and the long-press switching were removed (their values stay in the table below). Brief E-1 and K-9 updated (version 16).
- **Look confirmed (the user, 2026-11-14, phone screenshot, iPhone 17):** "The look is great." The screenshot shows the cleaned-up build: the wheel's light on, the ridges crowding and darkening towards the slot's ends, and the highlight on the upper half.
- **Built (not yet tried on the phone):**
  - **Where:** `src/EffortWheel.tsx` (the drawing, gesture and demo switch) and `src/wheelFeel.ts` (the feels and their maths). The old static wheel was removed from `PlateParts.tsx`. React Native's own `PanResponder` and `Animated` (0.88 docs) plus `expo-haptics`, so it runs in Expo Go and the current development build; no new build needed. Reanimated and gesture-handler are not installed and were not needed.
  - **Gesture:** a vertical drag rolls the cylinder; up turns effort up. The finger's position is mapped to levels, then shaped: inside the range a groove function makes the wheel linger at each step and hurry between them (`detent`, 0 to 1, never against the finger); past either end iOS-style rubber banding (`band`, `give`) limits how far it goes. On release a spring (`Animated.spring`, JS driver, because the ridges are laid out per frame) settles it into the nearest step. A new touch mid-spring picks the wheel up where it is (the groove and band are inverted to find the finger position).
  - **Haptics:** a tick each time the nearest step changes; a firmer stop once the finger goes `stopAt` points past an end (re-armed when it comes back).
  - **Look:** 26 × 160 cylinder of radius 88 in the 34 × 168 slot, so about 130° shows. Ridges sit at angles on the cylinder (5-point pitch at the centre), so towards the edges they crowd together (about 2 points apart at the edge against 5 in the middle), thin out and turn darker; each is lit by its angle to a light above, with a groove shadow beneath. Fixed layers on top: fine knurling across the ridges (fixed because lines round a cylinder do not move as it turns), the curve's shading, a highlight band where the curve faces the light, darker side edges, and the slot rim's shadow cast onto the wheel. The slot has a deeper inner shadow and a lit lower lip.
  - **Feels compared on the phone (switching removed after the choice):** a long press on the "Effort" marking moved to the next feel.

    | Feel | Travel per level | Groove | Tick | End stop | Band | Settle |
    |---|---|---|---|---|---|---|
    | A groove | 26 pt | 0.85 | selection | Rigid | 22 pt max | no bounce (ratio 0.77) |
    | B light | 18 pt | 0.5 | Light | Rigid | 30 pt max | no bounce (0.8) |
    | C notch | 34 pt | 1.0 | Medium | Heavy | 16 pt max | one small rebound (0.66) |
  - **Demo switch (replaced by T13's island demo on 2026-11-14):** `DEMO_EFFORT` in `EffortWheel.tsx` (temporary), set to `'high'`: the light is on and the wheel turns through low, medium, high, xhigh and max, logging each new level to Metro. `'off'` is the real state with nothing connected: unlit, and a drag does nothing (E-6). The level is not shown anywhere yet: the island's effort view is T13. VoiceOver can step it (adjustable, increment and decrement).
- **Checked in the web view (874 × 402):** the wheel draws as a ridged cylinder with the ridges crowding towards the edges. A drag of about 52 points up went from high to max (two steps of 26); a long drag down past the end settled on low. The type check passes. A script check of the maths: for all three feels the shown position never moves against the finger, and 200 points past an end moves the wheel only 14 to 25 points.
- **Not checked:** anything on the phone: the haptics, how the drag feels, frame rate (about 40 ridge views re-laid out per frame on the JS thread), and the look on the real screen. The browser pane drew the wheel too small to judge the texture closely.
- **Since:** T13 drives the wheel from the island (selected session, its level) and shows the level (E-2). Sending it to the PC is E-3 to E-7. Frame rate while turning was not measured, and the user reported no stutter.
- **Goal, in the user's words:** the wheel "needs to become functional with haptic feedback and some rubber banding and groove. and more physical texture in its look. rn it looks like a 2d flat image." Today `EffortWheel` in `PlateParts.tsx` is a static drawing: a slot, 32 flat ridges and a shading gradient, with no gesture.
- **Scope:** this task covers the phone side only: the gesture, the feel and the look (E-1 and K-9). Sending the change to the PC (E-3 to E-7) needs the connection (T8). The half-height island (E-2) belongs with the island's open states. Until then, the wheel can turn through a demo session's levels (low, medium, high, xhigh, max) behind a temporary switch. With nothing connected it stays unlit and does nothing (E-6).
- **Do:**
  - **Gesture:** a vertical drag on the wheel turns it. The ridges move with the finger, so it reads as a cylinder rolling, not a slider.
  - **Steps, the "groove":** one detent per level. The wheel snaps into the nearest step on release, with a haptic tick each time it passes a step (E-1).
  - **Ends, the "rubber banding":** past the first or last level the wheel keeps moving but resists more the further it goes, then springs back on release. A firmer haptic marks the end stop (E-1).
  - **Look:** make the wheel read as a rounded cylinder in a recessed slot, not a flat image. Ridges should get closer together and darker towards the top and bottom edges, as on a real curved surface. Add a highlight along the curve, a shadowed slot with depth, and fine knurling texture. Compare with the mockups' `.wcyl` and `.wslot` and improve on them; the user finds the current drawing flat.
  - **Libraries:** check the live docs for the installed versions of `react-native-gesture-handler` and Reanimated (both are thought to be in Expo Go), or use React Native's own `PanResponder` and `Animated`. Use T6b's haptic findings: five fixed impact styles, so the tick is likely Light or a selection haptic, and the end stop Rigid or Heavy.
  - **Try them:** build a few feels (detent strength, resistance, tick style) behind a temporary switch, and let the user choose by feel on the phone.
- **Done when:** the user has turned it on the phone and confirmed the feel and the look, and E-1 and K-9 in the brief say what was chosen. The web view can show the look and the movement, but not the haptics.

### T13. Open the island: every state in the mockups, moving as the prototype does (built 2026-11-14; compared with every board; first phone fixes in, not re-checked on the phone)
- **Decided by the user (2026-11-14), from the open points below:** the real agent logos (copied from the design canvas's assets into `apps/mobile/assets/agents/`; trademark use stays the user's call before release); answer keys light 0.6 s after a request shows; no mark on the selected number key (K-3 unchanged); the prototype's placeholder row for an empty number key, with the mockup's title "Agents" alone.
- **Built:**
  - **Where:** `src/island/`: `demo.ts` (the demo sessions, requests and replies), `store.ts` (the state and every behaviour below, ported from the prototype's script), `Island.tsx` (the shape, its motion, the pill and the fades), `views.tsx` (each open view), `parts.tsx` (glyphs, agent icons, the loops, type). `Deck.tsx` now places the island, slides the key area and takes the lights from the island; the T6 demo lights (`DEMO_LIGHTS`) and T12's `DEMO_EFFORT` are gone, replaced by the island's demo.
  - **Motion:** the island's width, height and corner radius and the key area's edge move together on one 0.52 s `Easing.bezier(0.32, 1.28, 0.45, 1)`, all on the JS driver (the native driver cannot move layout). Each key's left edge and width are straight lines in the grid's width, so they are `interpolate`d from the same animated value with no re-render per frame; the glow is now sized in percent so it follows. The island stays centred top to bottom, which gives every board's top (139, 119, 12, 116). Fades, the nudge, and the loops (spinning arc, amber and red pulses, caret) follow the prototype's times; Reduce Motion (`AccessibilityInfo`) makes them near-instant and stops the loops.
  - **Demo trigger:** a long press (0.5 s) on the Link light makes the next demo event, in turn: a request, a session finishing, a session starting (on page 2 once the six keys are full). Remove with `demo.ts`.
  - **Decided here, not in the sources:** the wheel's change is "sent" 0.9 s after it stops (E-3 leaves this open) and the island closes 2 s after the effort result (E-2); turning back to the starting level returns to the session view with no result. Only Claude Code sessions light the wheel (E-6). The demo's mobile-app (key 5) always answers "Not changed", so Effort 3 can be seen. A queued follow-up can be cancelled with Cancel from its session's view (V-4 says it can be cancelled; neither source shows how). The list's page dots show only when there is a second page (board 2 always draws two). Half-height card titles may wrap to two lines: "<project> is not working" did not fit on one.
  - **Not built:** speech recognition (Listening shows the demo's words, a word every 190 ms, as the prototype does), layout mode, pairing, and the wiring to the PC.
- **Checked in the web view (874 × 402), by eye against the boards and by measuring:** at rest (1), session list (2) and its second page by swipe, request (3), hidden request (9: tall amber pill, answer keys dark, the first answer press shows it again), Allowed (4), listening (5), transcript (6), Reply sent, session view (8, wheel light on), Effort 1, Effort 2, Effort 3, saved reply (Reply 1), Follow-up queued (Reply 2), "finished", "started", and the "not working" hint. The open island measured 320 × 378 at top 12 with radius 38, and the key area ended 348 points from the camera edge. No console errors. The type check passes. The island is on the right in the web view (T2), so the mirrored layout was the one checked.
- **First phone screenshots (the user, 2026-11-14, iPhone 17) and what they showed:**
  - **The island sat about 19 points too high:** the open island ran off the top of the screen and the closed pill sat above the cutout. iOS resolves a percentage `top` against the parent's height less its padding (402 − 16 − 21 = 365, so 50% is 182, not 201); the web uses the full height. Fixed: the island is now centred in points from the window's height.
  - **The pill's count was hidden** behind the camera cutout, and its spinner was clipped at the cutout's top edge (because of the shift above). With the pill exactly on the cutout, the board's glyph (y 154 to 170) and count (y 231 to 249) both fell inside the cutout (y 139 to 264), where the phone shows nothing (the open point from T3). **Decided by the user (2026-11-14): extend the pill past the cutout, as iOS's Live Activities do.** The first sizes (32-point ends, 40 with a request) were guesses; the user asked whether they were native, and sent a screenshot of Spotify's Live Activity (iPhone 17, portrait, 1206 by 2622, 3 pixels a point). **Measured in code from that screenshot:** the island is 190 by 37.3 points (its ends located from the corner curve at two rows, 12.7 and 15.3 points from the centre line, which agree to 0.1 point), so iOS extends it **32.5 points past the 125-point cutout at each end**; the artwork is 23 points wide, 9.3 points from the outer end, and the playing bars 20.7 wide, 10 from the outer end, so the content is centred about **20.5 points from the outer end**; the island does not change size between states. **Now built from these:** the closed pill is 37 by 190 at y 106 in every state (the extra length for a waiting request is dropped), with the glyph and count centred 20.5 points from each outer end, in `Island.tsx` and `gen-island.ps1`; boards regenerated, README updated. Measured on the web: the app matches the new Island 1 and Island 9 (glyph centred at y 126.5, count at y 275.5), clear of the cutout by 4.5 and 1.5 points, about as close as Spotify's artwork sits to the camera (about 2 points). **Assumptions not checked:** the measurement is from portrait; that iOS draws a Live Activity the same size in landscape is assumed, not measured. The measured island's centre came out at x 199 against the screen's 201, within the error of locating anti-aliased edges. Brief K-7 updated (version 18). **Not done:** the canvas is not republished, and the pill is not yet seen on the phone.
  - **"always allow" overflowed its narrowed key:** the boards break it, and "run tests", over two lines (`always<br>allow`). Fixed in `layout.ts`.
  - **Number keys looked like lit tiles with dark corners while the island was open.** Not reproduced on the web (no glass there); not yet explained. Check again on the phone after these fixes.
  - The gear over the Request light is the development build's own tools button, and the orange dot inside the island is iOS's microphone indicator (most likely from the phone call used to make iOS draw the island); neither is the app's.
  - **The plate's `onLayout`** (a `Pressable`) stopped reporting on the web, so no keys were drawn there; the plate now takes its size from `useWindowDimensions`.
- **Side-by-side comparison (2026-11-14):** `make-compare.ps1` now opens the app with `?scene=<board>` (web only, `src/island/scenes.ts`): it puts the island straight into that board's state, with the iPhone 17's insets (62, 62, bottom 20), the camera on the left as the boards draw it, and motion off. Each of the 14 island boards and its scene were measured in code at 874 × 402: the island's rectangle and radius, every text's box, size, line height, weight and colour, the icons' boxes, the key wells, which keys are unlit, and the three LEDs.
  - **Matched exactly:** the island's rectangle and radius on all 14; every key well (open: 86 × 73 number keys, keys ending 348 from the camera edge); icon positions and sizes; every text's size, weight and colour; which keys are unlit; the Link and Request LEDs; the session dots.
  - **Matched within 1 to 3 points:** text positions, from the browser's font boxes against React Native's line boxes. Line breaks differ where Windows fonts are wider than the app's (the board's Reply 2 subtitle wraps; the app's does not).
  - **Fixed from the comparison:** number-key digits were 24 points, the boards' four-row grid uses 20 (`.g4 .num`), and the status dot sits at 8, 9 not 10, 11 (`.g4 .dot`); the session view's tool calls were cut to one line, the board wraps them; the wheel's light was off in Effort 2, Effort 3, Reply 1 and Reply 2, where the boards keep it on because a Claude Code session is still selected (the light now follows the selection, and a follow-up no longer clears it).
  - **Left different on purpose:** the list's page dots show only when there is a second page; board 2 always draws two, while board 1's count of 6 says there are only six sessions. The white outline the boards draw round a pressed key or the turning wheel is the boards' own marker, not app UI (agreed earlier).
  - **Not compared:** the board logos (served only from the canvas, so they show broken locally; the app's are the same files); layout mode and pairing (not built).
- **Not checked:** anything on the phone: the motion and its frame rate (the browser pane draws too few frames to judge), Liquid Glass keys narrowing during the slide, the left-camera layout, Reduce Motion, haptics on the wheel inside the effort flow, and fonts (SF Pro text widths). Boards 7 (Island 7, "finished" with key 1 green) and the Denied, Always allowed and Thrown away cards were reached in the store but not each looked at. The boards were compared by eye from screenshots, not with `make-compare.ps1` side by side.
- **Goal, in the user's words:** plan the island "according exactly to the prototype and mockup". Today the app draws only the closed pill (`IslandPill` in `PlateParts.tsx`), with nothing in it, and it never opens.
- **Sources, and which one wins:**
  - **The mockups** (`design/mockups/gen-island.ps1`, boards `Island1` to `Island9`, `Effort1` to `Effort3`, `Reply1` and `Reply2`) are newer and drawn at the iPhone 17's measured size. **They decide the geometry, the content, the text and the colours of every state they show.** The numbers below are copied from the generator.
  - **The prototype** (https://claude.ai/artifact/AXbJJjbCaffPhaM8E1Zdy3, "Island Deck") is older. It has four number keys, a 844 by 390 screen, a 38 by 140 pill and a 366-point open island. **It decides only what the mockups cannot show:** motion, timing, what each touch and key does, and states the boards leave out.
  - **The brief** (K-1, K-3, K-5, K-7, K-8, A-2 to A-8, A-14, E-2, V-2 to V-4, R-2, R-3) wins over both where they differ. Each difference is listed under "Open, for the user" below rather than settled quietly.
- **Scope:** the phone side only, run by a demo data source behind a temporary switch, like the demo lights (`lights.ts`, T6). Wiring the island to the PC link (T8) is the next task (A-1 to A-3, Release 2). Not here: layout mode (`IslandLayout1` and `2`, K-6), pairing (`IslandPair`), and the wheel's gesture (T12). The half-height effort view (E-2) is built here, so T12 can open it.
- **Geometry (mockups):** island colour `#000`, 14 points from the camera edge.
  - **Closed pill:** 37 by 125, top 139, corner radius 18.5, outline `0 0 0 1px rgba(255,255,255,.035)`. Glyph at the top and count at the bottom, 15 points in from each end.
  - **Closed, with a request hidden (A-8):** 37 by 164, top 119.
  - **Open, full height:** 320 by 378, top 12, radius 38, shadow `0 0 0 1px rgba(255,255,255,.07), 0 18px 44px rgba(0,0,0,.6)`.
  - **Open, half height** (results and effort): 320 by 170, top 116, radius 36.
  - **Keys:** the key area starts 62 points from the camera edge when closed, and 348 when open at either height. The keys narrow to fit (K-7, K-11).
  - **Right-handed (K-8):** mirror the island to whichever side the camera is on (`useCameraSide`). That includes the content padding that keeps text clear of the cutout. The mockups show only the left.
- **Motion (prototype):**
  - **Island and keys:** left, top, width, height, corner radius, and the key area's left edge all move together over 0.52 s on `cubic-bezier(.32, 1.28, .45, 1)`, which overshoots slightly.
  - **Pill content:** fades out over 0.08 s on opening, and back in over 0.2 s after a 0.16 s delay on closing.
  - **Open content:** fades in over 0.26 s after 0.15 s. Switching between open views fades out over 0.1 s, then draws the new view after 110 ms.
  - **Loops:** the amber request dot pulses every 1.1 s, to 45% opacity and 80% size. The red listening dot pulses every 0.9 s. The working glyph spins once a second. The transcript caret blinks.
  - **Nudge:** pressing an unlit key shakes the island: 3 points out, 2 back, over 0.32 s.
  - **Reduce Motion:** all of these become near-instant, and the loops stop.
  - **Check first** whether React Native's `Animated` can move layout properties at 60 fps on the phone. The native driver cannot animate width, height or left. Reanimated is not installed. Moving the key area also changes every key's width, so measure that on the phone.
- **Text and parts (mockups):**
  - **Content padding:** open views 16, 16, 14 and 54 points (54 on the camera side). Half-height results 0, 18, 0 and 56, with a gap of 12.
  - **Type:**
    - title: 17/22, weight 600, letter spacing -0.43
    - subtitle: 13/18, spacing -0.08, `rgba(235,235,245,.6)`, padding 12, 4, 8
    - status line: 12/16 muted
    - row name: 15/20, weight 500
    - footer: 12/16 muted, padding 10, 4, 0 (the prototype's values)
  - **Content box:** `#1C1C1E`, radius 12, padding 12. Code inside it: monospace 13/20. Spoken text: 17/23.
  - **Session header:** number, agent icon (28, radius 7), project name as the title, status in its colour (A-3), status glyph on the right.
  - **Result badge:** a 42-point circle, tinted at 18% of the result's colour, with a 20-point glyph at stroke 2.6.
- **States to build, each matched to its board:**
  1. **At rest** (`Island1`): the pill shows a white spinning arc and the session count ("6").
  2. **Session list** (`Island2`), opened by tapping the pill:
     - title "Agents", then one 44-point row per number key on the deck (A-2): number, icon (26), project name, status in its colour, status glyph
     - footer "AMOGH-PC on Wi-Fi", with page dots on the right (6 points; white for the current page)
     - a swipe changes the page (K-5)
  3. **Request** (`Island3`), which opens by itself (A-4):
     - header status "Needs Approval" in amber `#FF9F0A`, with a "!" glyph
     - subtitle "Wants to run a command with Bash", the command in the code box (it scrolls if long, K-5)
     - footer "Request 1 of N" on the left and "Tap to hide" on the right
     - number key 1 glows amber and the Request light comes on (A-8)
     - Allow, Always Allow and Deny light, after a short delay (A-5)
  4. **Allowed** (`Island4`), half height: green check, "Allowed", "api-server is running it now".
  5. **Listening** (`Island5`), while Redirect is held:
     - subtitle "Listening" in red `#FF453A`, after an 8-point red dot
     - the words in muted text as they arrive
     - footer "Let go of the key when you finish."
  6. **Transcript** (`Island6`):
     - subtitle "Your Reply", with the text in white
     - footer "Send denies the request and gives Claude Code this reply."
     - Send and Cancel light (V-2)
     - when there is no request (V-4): subtitle "Your Follow-Up", footer "Send queues this for api-server."
  7. **Session finished** (`Island7`), half height: green check, "api-server finished", "Its turn has ended." Key 1 turns green.
  8. **Session view** (`Island8`), when a number key or row is pressed (A-7):
     - header status "Running" with the spinning arc
     - subtitle "Claude Code on AMOGH-PC. Recent tool calls:"
     - the last three tool calls in the code box, 6 points apart, in `rgba(235,235,245,.78)` (A-14)
     - footer "Hold redirect to queue a follow-up."
     - the effort wheel's light comes on (E-6)
  9. **Request hidden** (`Island9`): the tall pill shows the pulsing amber dot and the count in amber. The answer keys go dark.
  10. **Effort** (`Effort1`), half height:
      - the session header
      - five segments with the labels low, medium, high, xhigh and max; segments up to the chosen level are white, the chosen label is white and bold
      - footer "Effort was high. Keep turning or stop."
  11. **Effort results** (`Effort2`, `Effort3`), half height:
      - "Effort: xhigh", "api-server, from its next message", with a green check
      - "Not changed", "api-server is still on high", with an amber "!"
  12. **Saved reply** (`Reply1`, `Reply2`, R-2):
      - subtitle "Saved Reply", the text as spoken text, footer "Send queues this for the end of the turn."
      - then, half height, "Follow-up queued", "api-server gets it when its turn ends"
  13. **States only in the prototype, all half height:**
      - "Always allowed": two checks, green
      - "Denied", "api-server will try another way": red cross, tint `rgba(255,69,58,.18)`
      - "Reply sent", "Denied, and api-server has your reply": blue up arrow, `#409CFF` on `rgba(10,132,255,.2)`
      - "Thrown away": neutral undo, with "The request is still waiting for you." or "Nothing was sent."
      - "<project> started": shows the agent's icon at 40 points
      - hints: "Key N is free", "Pick a session first", "<project> is not working", "Hold to talk"
- **Behaviour (prototype, checked against the brief):**
  - **Tapping the closed pill:** does nothing while listening. Otherwise it opens the transcript if one is waiting, then the request if one is waiting, and if neither, the session list.
  - **Tapping the open island:** a row selects that session (A-7). During listening or a transcript, a tap does nothing. Otherwise the island closes, and a request it was showing becomes hidden (A-4). A tap on the plate outside the keys also closes the list or a session view. A request is never answered by touch (K-5).
  - **Number key:**
    - **Empty key:** the hint "Key N is free" (2.2 s).
    - **Pressed again while its session is open:** deselects it and closes the island.
    - **Otherwise:** selects that session. If it has a request, the request moves to the front and opens; if not, the session view opens. During listening or a transcript, the key only selects.
  - **Answer keys:** they work only while a request is showing.
    - **Unlit with a request hidden:** the first press shows the request (A-4).
    - **Unlit with no request:** the press only nudges the island.
    - **Lit:** a press shows its result for 1.5 s, then moves on.
  - **What follows a result:** a waiting transcript, then the next request, then closing.
  - **Redirect:**
    - **Hold:** replies to the request if one is showing, or if nothing else is selected (V-3). Otherwise it queues a follow-up for the selected working session (V-4).
    - **Selected session not working:** the hint "<project> is not working" (3 s).
    - **Nothing to reply to:** the hint "Pick a session first" (2.5 s).
    - **Released within 0.45 s:** the hint "Hold to talk" (1.9 s).
    - **Released after that:** opens the transcript.
  - **Send:** "Reply sent" or "Follow-up queued", shown for 1.7 s.
  - **Cancel:** "Thrown away", shown for 1.3 s.
  - **A new request while busy:** if a request is already showing, or the user is talking or has a transcript open, the new one only joins the queue and the count goes up. Otherwise it opens the island.
  - **"Started" and "finished" events:** shown for 2.5 s when nothing more important is open. Otherwise only the lights change (K-3).
- **Demo source (temporary):** a script of fake sessions and events matching the boards' data:
  - **The sessions:**

    | Key | Project | Agent | State |
    |---|---|---|---|
    | 1 | api-server | Claude Code | Running |
    | 2 | web-app | Codex | Finished |
    | 3 | docs-site | Cursor | Idle |
    | 4 | infra | Gemini | Thinking |
    | 5 | mobile-app | Claude Code | Error |
    | 6 | data-jobs | Codex | Running |

  - **The request:** `npm run db:migrate -- --env production`
  - **The transcripts:** "Use the staging database instead." and the saved reply "Run the tests and fix any failures."
  - **Making events happen:** a hidden trigger, for example a long press on the Link light, sends the next request or a "finished" event, so every state can be reached on the phone.
- **Check:** compare each state with its board side by side using `make-compare.ps1` (T2), then on the phone. CLAUDE.md applies: do not say it matches without looking.
- **Done when:** every state above can be reached on the phone, each matches its board, the motion matches the prototype, and the user has confirmed it on the phone.
- **Open, for the user, before or during the work:**
  - **Agent icons:** the mockups use the agents' real logos (Claude Code, Codex, Cursor, Gemini) in the island rows; the prototype uses lettered tiles. K-2 forbids icons on keys only. Whether the app may ship the real logos is a trademark question.
  - **Empty number keys:** the list's look for a key with no session is only in the prototype: a dashed placeholder, "No session" and "Start an agent on your PC". The list title also differs: the prototype adds "N of 4 keys"; the mockup has "Agents" alone.
  - **Answer-key delay (A-5):** neither source has the delay or a length. Suggest 0.5 to 1 s.
  - **Result times:** K-7 says about two seconds; the prototype uses 1.3 to 2.5 s by kind. The plan follows the prototype.
  - **The white outline on a pressed key or the wheel** is how the mockups mark the control in use; it is not app UI. The prototype instead outlines the selected number key at 55% white. K-3 says only lights change outside the island, so the outline is left out unless the user wants it.
  - **The prototype's "Keys make room" switch:** dropped. K-7 says the keys always slide aside.
  - **Pill glyphs for listening, a waiting transcript and layout mode:** the prototype has them (a red dot with level bars, a blue arrow with "1", and a grid). K-7 allows only a session or request count, and the island is open in those states anyway, so they are left out.

### T13b. The screen fixed open (2026-11-14, asked by the user)
- **Ask:** no collapsible island in the app, because the pill drawn round the camera cannot behave like the real island (a press there only bounces iOS's own cutout). Keep the screen where it sits when open, covering the real island ("I like how it appears to be hiding the dynamic island"), fixed there. Keep the half-height states, since they still cover the island. Mirror the "nothing to do" jitter so it never uncovers the island: toward the camera, then settle back without passing the resting place. Resting view: the session list. Confirmed with the user before any code was changed.
- **Built:**
  - `store.ts`: the state starts open on the list; everything that used to close the island now returns to the list (`collapse`); `tapPill` is gone; a tap on the list does nothing, on a session view or a request it goes back to the list (the request stays queued and hidden), on a result it moves on.
  - `Island.tsx` rewritten: no pill, no closed state, no press swell, no opening animation. Only the height and radius move, between full (378, radius 38) and half (170, radius 36), on the prototype's curve. View changes keep their fades. The jitter goes 3 points toward the camera over 80 ms (ease-out) and back to 0 over 240 ms (ease-out cubic), never past 0.
  - `Deck.tsx`: the key area starts at 348 points from the camera edge and stays there; keys get plain numbers, no animated values.
  - Mockups: Island 1 ("At rest") is the open list and Island 9 ("Hidden request") is the open list with session 1 "Needs Approval" in amber; `canvas.json` titles and `design/mockups/README.md` updated; all boards regenerated, no `@@` left. Canvas not republished.
  - Brief K-5, K-7 and A-8 rewritten (version 20).
- **Checked on the web:** the type check passes. Islands 1 and 9 against their scenes: the screen at 14, 12, 320 by 378 on both; every row within 1 to 2 points; "Needs Approval" amber on 9; key 1's well 85.6 by 73 (board 86 by 73). The jitter, sampled every 10 ms after a press on Cancel with nothing to cancel: out to 3 points toward the camera by about 100 ms, back to 0 by about 350 ms, never on the other side.
- **Seen on the phone (the user's screenshot, 2026-11-14):** the screen at rest measured 376 points tall from y 12.6 and 13.6 from the edge (a slightly scaled screenshot; design 378 from y 12), so the stuck swell is gone. Row 1's "Running, Follow-Up Queued" was cut off; now "Running, Queued" (and "Thinking, Queued").
- **Corner parallel to the display's (the user, 2026-11-14):** the iPhone 17's display corner is reported as 62 points, a continuous curve (UIScreen's private `_displayCornerRadius` in the ScreenCorners table, github.com/kylebshr/ScreenCorners, added Sep 10, 2025, probably read in the Simulator; Apple publishes no figure, and an Apple engineer said so in forum thread 762419; confirmed by a research agent and Perplexity). The full-height screen's corner is now 62 − 12.5 = 49.5 with `borderCurve: 'continuous'` (iOS only); the half-height screen keeps 36. Mockups: full-height `border-radius: 49.5px`, regenerated. Brief K-7 updated. Apple's public way to draw this automatically, SwiftUI's `ConcentricRectangle` (iOS 26), is not available from React Native views. Not yet seen on the phone.
- **Open, for the user:** how to recover "the screen appears only when there is something to read" and "motion that explains itself" with the screen fixed over the camera; three options offered (wide only when it matters, dark until needed, an arrival cue).

### T13c. Narrow at rest, wide when there is something to read (2026-11-14, option 1, chosen by the user)
- **Why:** to recover two things the collapsible island had, without a pill drawn round the camera: the screen changing only when there is something to read (so the change is the alert), and motion that explains itself (the keys making room). Chosen from three rendered mockups (today at rest; the narrow screen at rest; the wide screen with a request), sent to the user as images; the first narrow try at 230 wrapped project names at the hyphen, so 240.
- **Built:**
  - `Island.tsx`: `useScreenMotion` (used by the deck) animates height, corner and a `wide` value 0 to 1 together on the prototype's 0.52 s curve; the screen's width is 240 (narrow) to 320 (wide). Only the session list rests narrow (`isNarrow` in `views.tsx`); every other view is wide, results and effort included (their text was laid out for 320, and they are something to read).
  - `Deck.tsx`: the key area starts at 268 points from the camera edge when narrow and 348 when wide; the column's margin and each key's left and width are interpolated from `wide`, so they move with the screen and no re-render per frame.
  - `views.tsx`: the list is compact on the narrow screen: 24-point icons, 8-point gaps, names on one line, the coloured status glyph, no status words (kept in the spoken label); an empty key shows "No session".
  - Mockups: boards 1, 2 and 9 are the narrow screen (`OpenNarrow`, `Narrow` in `gen-island.ps1`), keys at 268; board 2 keeps its page dots; regenerated, no `@@` left.
  - Brief K-7 and A-8 rewritten (version 21).
- **Checked on the web:** the type check passes. Boards 1, 2, 9 and 3 against their scenes: screen 240 (rest) and 320 (request) wide; key 1 at 268 and 101.6 wide (rest) or 348 and 85.6 (request); Deny 212.2 or 180.2; every name within a point. Motion sampled every 10 ms: hiding a request narrows the screen 320 to 240 in about 0.5 s (dipping to 237.9 before settling) while key 1 grows 85.6 to 101.6; a new request widens it 240 to 320 (to 322 and back) while key 1 returns to 85.6.
- **Not checked:** on the phone, including how the glass keys look at the wider resting size (they were tuned at full width in T6, so the lit-tile look may ease) and the frame rate of the slide.

### Mean review of T13, T13b and the Live Activity (2026-11-14, asked by the user, with every uncaught promise)
- **Fixed, must-fix:**
  - **Two Live Activity controllers could run at once and fight.** `startLiveActivity` had no guard and no clean-up: a second start (a remount, a reload of that module) ended the first controller's activity on start, the first then failed to update its own, restarted, and ended the second's. That is the "Can't find live activity" error seen on the phone. Now a second start stops the first, and `App.tsx` stops it on unmount (the effect returns the stop function).
  - **Allow and Deny from the real island answered whatever request was oldest when pressed,** not the one drawn. The buttons now carry the request's id (`allow:<id>`, `deny:<id>`), and `answerFromLiveActivity` acts only if that request is still the oldest.
  - **A request answered from the real island left its spoken or saved reply behind,** which Send would then report as sent. Resolving a request now drops a reply in progress or waiting for it.
  - **Loading expo-widgets or registering the button listener could throw inside a React effect** (a red screen). Both are now caught; the Live Activity is then left off.
  - **A failed start retried on every island change and every 20 s,** with Live Activities turned off in Settings. It now waits 60 s before trying again.
  - **Unhandled rejections:** `Haptics.impactAsync` in `pressFeel.ts` (both) and `wheelFeel.ts`; `AccessibilityInfo.isReduceMotionEnabled()` in `Island.tsx`; `getOrientationAsync()` in `useCameraSide.ts` and `Measure.tsx`; `requestPermission()` in the T8 test screen; and `useKeepAwake()` in `App.tsx`, which on every remount released a wake lock that had not started (an "Uncaught (in promise) … has not activated yet" on the web, from before T13), now with the library's own `suppressDeactivateWarnings`. `keySound.ts` was already safe (each load is caught).
- **Left, nice-to-have:**
  - The store's `open` field is always true now (T13b) and could be removed with its checks.
  - The screen's tap target is `accessible={false}`, so VoiceOver cannot hide a request or move a result on.
  - The effort result can replace a request that arrived during the 0.9 s pause; the request returns after the result.
  - The Live Activity's buttons show only when its data is fresh, but iOS may show an expanded view drawn before Deck was suspended; the id check above keeps that safe.
- **Re-verified:** the type check passes; on the web a key press opens the session view and Cancel jitters with no unhandled rejection (listened for in the page); a fresh load has no console errors. **Not verified:** the Live Activity fixes on the phone (it runs only there).

### Research: can the deck use the real Dynamic Island? (2026-11-14, asked by the user)
- **Why:** on the phone, a long press on the island only made iOS's own cutout bounce; the app's extended pill did not move with it, unlike Spotify's Live Activity, which iOS draws and animates as one shape.
- **How:** three research agents (Apple docs and the HIG read through their DocC JSON; Expo and library docs, GitHub and npm; Apple forums and WWDC transcripts) and Perplexity, all from live sources. Nothing was built or tried on a device.
- **Findings:**
  - **Only a Live Activity can draw in the real island,** written in SwiftUI in a widget extension (ActivityKit and WidgetKit). Apple: "Live Activities are the only way for your app to provide its own UI in the Dynamic Island" (developer.apple.com/news/?id=qpqf1gru). There is no API to draw in it from the app's own views.
  - **iOS hides an app's own Live Activity while that app is open.** HIG, Live Activities: "Your Live Activity appears in the Dynamic Island while your app isn't in use, and other items can appear in the Dynamic Island when your app is open." The deck is always open, so its own Live Activity would never show in the island while in use.
  - **The one exception, `.transient` (iOS 18):** a Live Activity shown in the expanded island while the person uses the app. It ends when the person collapses it, taps outside the island, locks the phone or leaves the app, so the first key press would end it. Whether it shows in landscape is not documented.
  - **Landscape:** Live Activities appear in the island in landscape only from iOS 27 (WWDC26 session 223), at a narrow width (fit a 28-point circle, `isDynamicIslandLimitedInWidth`). The user's phone ran iOS 26.6 when measured (T1). The agents report iOS 27 shipped in September 2026; not checked against Apple's newsroom.
  - **Reading the island's frame:** iOS 27.1 adds `ReservedRegion` (SwiftUI and UIKit), which reports areas such as the island in points. It reports; it does not let an app draw there or follow the island's animation. One agent found it described for the camera and the foldable's fold rather than the island; not checked on a device.
  - **Interaction:** a tap on a Live Activity in the island opens its app; a touch and hold shows the expanded view, which can hold buttons and toggles (App Intents, iOS 17). Touches on the cutout itself go to iOS, which is why only the cutout bounced.
  - **Design and review:** the HIG says "Don't add elements to your app that draw attention to the Dynamic Island." App Review 5.2.5 rejects apps that look confusingly like Apple's interface; no rejection naming the Dynamic Island was found. This is a risk for K-1's app-drawn island, not a confirmed rejection.
  - **Expo and React Native:** `expo-widgets` (Expo's own, ~58.0.28 for SDK 58, stable since SDK 56) builds Live Activities in JSX through `@expo/ui` SwiftUI components, with a config plugin, every island region, push updates and buttons; it needs a new development build, not Expo Go. Alternatives: Voltra 2.4.0 (Callstack, JSX), `@bacons/apple-targets` (hand-written SwiftUI). `expo-live-activity` is archived and deprecated.
- **Decided by the user (2026-11-14):** keep the island the app draws while Deck is open, make it press like iOS's own, and add a real Live Activity for when Deck is not on screen. Brief K-1, K-5, K-12 and S7 updated (version 19).
- **Built (2026-11-14):**
  - **Press feel** (`Island.tsx`): a press on the closed island swells the whole shape to 1.06 and springs it back with one small wobble (`PRESS_SWELL`, `SWELL_IN`, `SWELL_OUT`). Set by eye; Apple publishes no figures. Touches on the camera itself still go to iOS.
  - **Live Activity:** `expo-widgets` and `@expo/ui` ~58.0.28 installed with `pnpm exec expo install`; Expo added the `expo-widgets` config plugin to `app.json` with its defaults. `src/liveActivity/DeckActivity.tsx` is the layout (`createLiveActivity`, the `'widget'` directive, `@expo/ui` SwiftUI components with SF Symbols): compact, a glyph and the count (amber with a request); minimal, the glyph; expanded, the summary, the request's verb and command, and Deny and Allow buttons; the Lock Screen banner, the summary and the command. `src/liveActivity/index.ts` starts it when the deck opens, updates it on every island change and every 20 s while Deck is active, with a stale date 45 s ahead so it shows "Open Deck to see the latest" once Deck stops refreshing, and passes Allow and Deny to `island.answerFromLiveActivity`.
  - **Checked in the installed packages, not only the docs:** the plugin sets `NSSupportsLiveActivities` and the App Group entitlement, and registers the extension with EAS (`extra.eas.build.experimental.ios.appExtensions`); Live Activity buttons use Apple's `LiveActivityIntent`, which Apple documents as running in the app's process; the `'widget'` directive is compiled by `babel-preset-expo`'s widgets plugin, so no Metro change is needed. `expo config --type introspect` shows `NSSupportsLiveActivities` true, App Group `group.dev.amoghmade.agentconsole` on the app and on the extension `dev.amoghmade.agentconsole.ExpoWidgetsTarget`.
  - **Safe in the current build:** `expo-widgets` throws when its native module is missing, so `startLiveActivity` checks `requireOptionalNativeModule('ExpoWidgets')` first and does nothing in the build installed now, on the web and on Android.
- **Six key dots (the user, 2026-11-14, from Spotify's expanded island):** the expanded island and the Lock Screen banner show keys 1 to 6 as numbered SF Symbol circles in their state's colour (A-3: thinking blue, running white, needs approval amber, finished green, error red, idle an outline, no session a dashed ring; all grey once stale). With a request waiting, the dots sit above the command and the buttons. A tap opens Deck (iOS's default for a Live Activity). `keys` in `DeckActivityProps`, filled in `liveActivity/index.ts`.
- **Checked:** the type check passes (the Live Activity layout included); the web view runs with no console errors.
- **Fourth development build (2026-11-14):** build 1688d9c3, with expo-widgets' native code and the Live Activity extension. EAS found the second target (`ExpoWidgetsTarget`) and set up its credentials after the user signed in to their Apple account in the build's terminal; it took about 45 minutes, most of it waiting at that prompt. Installed on the phone.
- **Seen on the phone (the user's screenshot, iPhone 17, 2026-11-14):** after leaving Deck, the Live Activity showed in the real Dynamic Island. Expanded: the working glyph (dashed circle) on the left, the count 6 on the right, "6 sessions, working", the six numbered dots in the demo's states (1 white, 2 green, 3 an outline, 4 blue, 5 red, 6 white) and "Tap to open Deck." This confirms that the extension builds and installs, that the app starts the activity, that the `'widget'` layout renders in the island, and that the key states reach it.
- **Phone screenshot of the open list (2026-11-14):** the island is centred now (the 19-point shift is fixed) and the two-line legends show. **Found:** the open island measured 400.7 points tall, 378 × 1.06: the press swell stuck, because the tap opened the island and removed the closed pill's touch area before the release arrived. Fixed: the swell springs back whenever the island opens or closes. **Still there:** the glass number keys look like lit tiles with dark corners while narrowed; not explained (see T13).
- **The count was clipped in the expanded Live Activity's top-right corner** (the user, 2026-11-14). Fixed: the expanded leading and trailing slots are inset (leading 10 and top 8, trailing 12 and top 8), as the HIG asks. A layout change needs no new build: `createLiveActivity` stores the layout string in the shared App Group storage when the app's JavaScript starts (`LiveActivityFactory.swift`), and the extension reads it from there. Not yet seen on the phone.
- **Unhandled rejection on the phone (2026-11-14):** "Calling the 'update' function has failed: Can't find live activity with id …". Deck updated an activity iOS had already ended (swiped away, the 8-hour limit, or ended by a reload), and the promise was not caught. Fixed in `liveActivity/index.ts`: failed updates and ends are caught, and the next refresh while Deck is in the foreground starts a new activity (starting is skipped in the background, where iOS does not allow it). Not yet seen on the phone.
- **Not checked yet:** the compact and minimal views and the Lock Screen banner; a request with the Deny and Allow buttons, and whether a press reaches Deck in the background; the stale state after Deck has been suspended for 45 seconds; tapping to open Deck; the press feel on the in-app pill; the earlier T13 fixes (island position, legends) on the phone.
- **Open:** keeping the Live Activity current while Deck is suspended needs pushes from the PC agent (APNs, a key from the user's Apple account, `enablePushNotifications` in the plugin). Not built.

### Later, from the brief
Wiring the deck and island to the PC link (A-1 to A-3), layout mode, voice, the PC tray agent proper, and more agents. Take these from the brief's releases in order now that T1 to T8 are done.

## Open decisions

- **The tray agent's language.** The spike uses Node. The real agent needs a tray icon and Windows console calls; C# does both easily but shares no code with the phone, and the .NET SDK is not installed on this PC.
- **How far to use console typing** beyond the effort wheel (brief, open decision 5).
- **Final name, licence.** (The bundle identifier was decided in T10.)
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
pnpm --filter mobile start
```

That starts it for the development build (T10). Open Deck on the phone and pick the server, or type `http://<PC address>:8081`. To make a new build after adding a native library or changing `app.json`, run this from `apps/mobile`:

```bash
pnpm dlx eas-cli@latest build --platform ios --profile development
```

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
- **T9 changed the user's Claude Code settings:** a test `/effort low` wrote `"claude-haiku-5-5": { "effortLevel": "low" }` under `modelSettings` in `~/.claude/settings.json` (20:38 on 2026-11-13). Whether that entry existed before is not known. Removed at the user's request the same evening.
- T9 opened two test console sessions, one elevated, in a scratch folder under the session's temp directory; both are closed.
- pnpm is allowed to run esbuild's install script (`pnpm-workspace.yaml`).
