# Agent Console (working title "Deck")

A free iPhone deck for coding agents, with a tray agent on the Windows PC.

## Read first

1. `docs/HANDOFF.md`: current state, known defects, and the task list in order. Start here.
2. `product-brief.md`: the requirements. IDs such as K-2 or E-5 refer to it.

## Layout

- `apps/mobile`: the phone app (Expo SDK 58, React Native, TypeScript).
- `apps/agent`: the PC side (Node, TypeScript): the phone link, the hooks, the session list. Saved replies live in `~/.deck/replies.json` until the tray window exists.
- The deck runs on the PC link; `SOURCE` in `apps/mobile/src/island/source.ts` switches it to the demo sessions for design work (or `?demo` on the web).
- `packages/protocol`: types shared by both.
- `design/mockups`: the design boards and their generators. The visual target for the app.
- `spike/console-typing`: test scripts for the effort wheel's route. They type into real sessions; read the README before running anything.

## Commands

- Install: `pnpm install`
- Phone app in Expo Go: `pnpm --filter mobile go`
- Type check everything: `pnpm typecheck`
- PC script: `pnpm agent`
- Deck's hooks in `~/.claude/settings.json`: `pnpm agent --install-hooks` or `--remove-hooks`; add `--dry-run` to see the diff only. Ask the user before writing their real file.
- A stand-in phone for testing the agent: `pnpm --filter agent watch`
- Add an Expo library: `pnpm exec expo install <package>`, run inside `apps/mobile`

## Rules

- **Use pnpm,** never npm or yarn.
- **One codebase.** React Native with Expo for iPhone and, later, Android. Do not add iOS-only libraries where a cross-platform one exists, and do not create `ios/` or `android/` folders by hand.
- **No Expo Router.** The app is a single screen. Ignore the template's advice in `apps/mobile/AGENTS.md` where it conflicts with this file.
- **Check Expo and React Native APIs against live documentation** for the installed version before using them. Do not rely on memory.
- **Never claim the app matches the design from a type check.** Look at it (see T2 in the handoff) or say it was not viewed. Take device sizes from the phone or a live source, not from memory.
- **Design rules that are settled:** each key does one action and has a fixed legend; no app icons on keys; outside the island only lights change; no on-screen keyboard. Do not add features the brief does not list.
- **Keep the brief current.** When a requirement or decision changes, update `product-brief.md` in the same piece of work.
- **The product name must not contain "Claude".**
- **Commit only when the user asks.**
- **Say what was and was not verified** in every report.
