# Spike: typing into a session's console

Test scripts that proved the effort wheel's route (brief: "Tested on this PC (2026-11-13)", E-5, E-7, G0-5). They are not product code.

**These scripts type into real terminal sessions.** A wrong key can answer a prompt, send a message to a model on the user's account, or trigger an update. Read the target's screen before every send, and get the user's agreement before testing against any session.

## How it works

A background process detaches from its own console, attaches to the console of another process, and writes key records into that console's input buffer. No window focus is used. The same attachment can read the console's visible text.

## Files

- `inject.ps1`: does the work. Parameters: `-TargetPid`, `-Text`, `-Log`, optional `-Enter`, optional `-Screen` (also writes the console's visible text to the log).
- `lib.ps1`: helpers to dot-source. `Key <pid> <text> [-enter]` types; `Screen <pid> [lines]` returns the visible text; `ClaudePids` lists Claude Code processes.
- `target.ps1`: a stand-in program that reads raw keys, for trying the method safely.

## Writing keys in `-Text`

- `\e` is Escape and `\xNN` is a control character (for example `\x13` is Ctrl+S).
- `{L}` and `{R}` are the left and right arrow keys, sent as real key records.

## What was learned

- **Arrow keys must be real key records.** Sent as an escape sequence, VS Code's terminal read the arrow as Escape, cancelled the `/effort` slider, and the next letter landed in the prompt box.
- **Stash a draft first.** Typing over text in the prompt box corrupts it. Ctrl+S stashes the draft and Claude Code restores it after the next command. On an empty box, Ctrl+S brings back an old stash instead, so the state must be known first.
- **Works in:** the classic console, Windows Terminal, and the terminals inside VS Code and Cursor, including during a running turn.
- **Does not work for:** sessions in the desktop app, which have no console.
- **Codex:** typing arrives, but its key handling is not understood. A test key press ran its updater by accident.
- **Do not edit `inject.ps1`'s embedded C# with non-ASCII characters.** Compare characters by number, as the file does now.

## Still to test

Listed under G0-5 in the brief and T9 in `docs/HANDOFF.md`.
