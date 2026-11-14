# Spike: typing into a session's console

Test scripts that proved the effort wheel's route (brief: "Tested on this PC (2026-11-13)", E-5, E-7, G0-5). They are not product code.

**These scripts type into real terminal sessions.** A wrong key can answer a prompt, send a message to a model on the user's account, or trigger an update. Read the target's screen before every send, and get the user's agreement before testing against any session.

## How it works

A background process detaches from its own console, attaches to the console of another process, and writes key records into that console's input buffer. No window focus is used. The same attachment can read the console's visible text.

## Files

- `inject.ps1`: does the work. Parameters: `-TargetPid`, `-Text`, `-Log`, optional `-Enter`, optional `-Screen` (also writes the console's visible text to the log).
- `lib.ps1`: helpers to dot-source. `Key <pid> <text> [-enter]` types; `Screen <pid> [lines]` returns the visible text; `ClaudePids` lists Claude Code processes.
- `target.ps1`: a stand-in program that reads raw keys, for trying the method safely.
- `step.ps1`: one wheel step as tested in T9 (`-p <pid> -arrow '{L}'` or `'{R}'`): stash, `/effort` and Enter in one write, wait for the slider, then the arrow and `s` in one write. It does not check the stash state first.

## Writing keys in `-Text`

- `\e` is Escape and `\xNN` is a control character (for example `\x13` is Ctrl+S).
- `{L}` and `{R}` are the left and right arrow keys, sent as real key records.
- `` is Enter in the middle of a write (`-Enter` only adds one at the end).

## What was learned

- **Arrow keys must be real key records.** Sent as an escape sequence, VS Code's terminal read the arrow as Escape, cancelled the `/effort` slider, and the next letter landed in the prompt box.
- **Stash a draft first.** Typing over text in the prompt box corrupts it. Ctrl+S stashes the draft and Claude Code restores it after the next command. On an empty box, Ctrl+S brings back an old stash instead, so the state must be known first.
- **Works in:** the classic console, Windows Terminal, and the terminals inside VS Code and Cursor, including during a running turn.
- **Does not work for:** sessions in the desktop app, which have no console.
- **Codex:** typing arrives, but its key handling is not understood. A test key press ran its updater by accident.
- **Do not edit `inject.ps1`'s embedded C# with non-ASCII characters.** Compare characters by number, as the file does now.

### Learned in T9 (2026-11-13, Claude Code 2.1.325)

- **Never confirm the slider with Enter, and never type `/effort <level>`.** Both save the level as the user's default in `~/.claude/settings.json`. Only `s` on the slider gives "this session only".
- **Send stash, `/effort` and Enter as one write.** Sent as separate writes about 2 seconds apart, the user's typing landed between them three times out of three, and Enter sent a fragment such as "aude /effort" to the model as a prompt. As one write, none did.
- **Arrow keys sent before the slider is on screen are lost** and a following `s` lands in the prompt box. Wait for "s for this session only" on screen, then send the arrow and `s`.
- **Keys typed at the PC while the slider is open are swallowed** (letters are ignored), and a typed `s` confirms early: one change in three was lost that way.
- **The stash holds one draft.** Ctrl+S over a second draft replaced the first, which was lost. A "stashed" marker shows above the prompt box while a stash exists, and goes when it is restored.
- **The prompt box's state:** the cursor column tells a draft (cursor after the text) from an empty box showing a suggestion (cursor at column 2), unless the user has moved the cursor to the start of a draft. Text colours cannot help: every cell read as attribute 07.
- **Elevated sessions:** `AttachConsole` fails with error 5 (access denied) from a normal process. Their hooks still reach the agent.
- **The current level** shows on the line above the prompt box ("medium  /effort").

## Still to test

Listed under G0-5 in the brief and T9 in `docs/HANDOFF.md`: Ctrl+S on an empty box with no stash; a multi-line draft; a session over SSH or in WSL; Codex, Cursor's agent and Antigravity.
