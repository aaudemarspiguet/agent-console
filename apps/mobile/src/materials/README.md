# Key material samples

These files draw one lit number key in each material tried in handoff task T5 (2026-11-13). The deck doesn't use them. They stay in the repo, at the user's request, for two reasons:
- they record why the keys look the way they do;
- they are a starting point for the theme setting in the brief (open decision 7).

To see them on the phone, set `SCREEN` in `App.tsx` to `'materials'`. `SHOWN` in `Materials.tsx` picks the five columns on screen.

## The samples

| Id | Material | Runs on |
|---|---|---|
| A | Plain: a gradient glow under a see-through cap, no library | everywhere |
| B | `expo-blur`: the cap blurs the glow under it | iOS, web; Android needs `BlurTargetView` |
| C1 | Liquid Glass, "regular" (`expo-glass-effect`) | iOS 26 and later |
| C2 | Liquid Glass, "clear" | iOS 26 and later |
| T1 to T3 | C2 tinted black at 25%, 45%, 65% | iOS 26 and later |
| D | React Native Skia: a real blurred glow and backdrop blur | everywhere (the web needs `canvaskit.wasm`) |

## Decisions

1. **Round 1** (A, B, C1, C2, D): the user ranked C2 first, C1 second, D third.
   - C2 bends the glow towards the cap's edges and lights its rim.
   - Plain C2 let the glow wash out the legend.
2. **Round 2** (C1, C2, T1 to T3): C1 is easier to read but "a lil too milky and diffuse".
   - The user liked the "glossy heaviness" of T1 (25% tint).
   - At 65% the white glow almost vanished.
   - **T1 was chosen. C1 is the runner-up.**
3. **On the deck (T6):** T1 was tuned over three rounds of phone screenshots:
   - **Too bright:** the full mockup glow, seen through the glass, made a lit key look like a lit tile.
   - **Glow reduced:** the glow under glass is now 0.7 as strong, smaller, and centred on the cap.
   - **Black unlit keys:** an unlit glass key was nearly black. The mockup's pale face now sits under the glass to fix this.
   - **Where it lives:** the result is in `src/Key.tsx`, and the full log is in `docs/HANDOFF.md` under T6.

## Known issues

- **D on the phone:** the white-lit Skia key draws no glow (a black cap), while the green one does. Both work on the web. This hasn't been investigated. Fix it before D is used as a fallback or a theme.
- **Glass elsewhere:** C1, C2 and T1 to T3 show a plain view on older iPhones, Android and the web. `GlassView` falls back to a `View` there.
- **Old values:** these samples use the mockup's glow at full strength. They don't have the T6 tuning.
