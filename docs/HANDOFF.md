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

### T12. Make the effort wheel turn, and look and feel physical (asked by the user on 2026-11-13; later)
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

### Later, from the brief
The island's open states (session list, request, transcript, results), layout mode, voice, the PC tray agent proper, and more agents. Take these from the brief's releases in order now that T1 to T8 are done.

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
