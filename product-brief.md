# Product brief: phone deck for coding agents

Version 8, 2026-11-13. Replaces version 7: the keys are drawn in Apple's Liquid Glass, "clear" style tinted 25% black (N-5), chosen from samples on the iPhone 17. Version 7: the deck has six number keys (K-10), two saved-reply keys (R-1 to R-5), and a five-by-four key grid that keeps keys square-ish (K-11). Version 6 made the effort wheel a requirement (E-1 to E-7), delivered by typing into the session's console, a route tested the same day. Version 5 moved the screen into an island beside the camera. Working title only; the final name must not contain "Claude".

## The idea

A free iPhone app that turns the phone beside your keyboard into a deck for your coding agents: it shows every session, lets you approve or deny a request with one press, and answers by voice.

- **Use case:** Your phone sits beside your keyboard and shows which agent is working, which is waiting, and exactly what it wants to run; you tap Allow, or hold a button and tell it what to do instead.
- **Who it's for:** Windows developers who run coding-agent sessions all day (Claude Code, Codex, Cursor, Gemini) and already keep a phone on the desk.
- **What it solves:** Agents sit blocked on a permission prompt in a window you aren't looking at; this puts every agent's prompt on one surface that is always visible, whichever vendor's agent it is.

## What changed since version 2

| Topic | Version 2 | Now |
|---|---|---|
| Touchpad | Release 1, the main screen | Cut from the core product. At the desk the real mouse is in reach, and away from the screen a pointer is useless. Parked as stretch goal S4 |
| Text input | Phone keyboard for typing | No keyboard anywhere. Voice is the only input besides taps |
| Phone role | Controls only | Controls plus a spoken reply to an agent |
| Agents | Claude Code first, others through HAPI | Agent-agnostic across Claude Code, Codex, Cursor, Gemini |
| Differentiation | Touchpad and deck on one screen | One free deck for every agent, with voice replies |
| Look | Unstated | Liquid Glass on a dark blue base, following Apple's guidelines |

## Use cases

1. **Blocked agent.** You are writing in one window while an agent runs in another. The request light comes on and the island opens with the exact command. You press Allow without switching windows.
2. **Wrong proposal.** The agent asks to run something you don't want. You hold the voice button, say "use the staging database instead", check the transcript, and send it with the denial.
3. **Several agents.** Claude Code, Codex, and Cursor sessions are running. One screen lists all of them; pressing a session's number key brings that window to the front.
4. **Other machines (stretch, through HAPI).** An agent on a dev box shows up on the same strip.

## Where it is different

Compared with the products researched in [competitor-research.md](competitor-research.md). "Not found" means not on any page opened, not a guarantee.

- **One deck for every agent.** The Stream Deck plugins found were each built for Claude Code, with Codex in a separate Elgato plugin.
- **Voice reply attached to a denial.** Not found in any Stream Deck plugin. Happy offers voice as a paid feature inside a full client.
- **Free with no key limit.** Stream Deck Mobile's free tier is 6 keys and the plugins cost $2.20 to $7.99.
- **One install on each side,** and sessions that appear with no layout work.

Not different: approving from a phone and live session status. Others do both well. App launching, which they also do, is cut from this product. This product now competes with them directly, which makes Gate 1 more important.

## Trade-offs decided

| Decision | Chosen | Given up | Why |
|---|---|---|---|
| Build or adopt | Build | Stream Deck Mobile plus a plugin covers Claude Code approvals today | Free, single app, every agent in one place |
| Pointer | None | Use as a remote mouse | The mouse is already in reach at the desk |
| Text input | Voice only | Typing on the phone | Landscape phone keyboards are poor, the real keyboard is in front of you, and one input method keeps the app simple |
| Connection | Local Wi-Fi only, direct | Use away from home | No relay means no running cost and no third party in the path |
| Phone tech | React Native with Expo | Lock-screen widgets and other Swift-only features | Buildable on Windows |
| Approval mechanism | Each agent's own hooks or interface | Agents that offer none | Documented by each vendor, and works when the terminal is elevated. Typing into the console is used only where no hook exists (the effort wheel) |
| Effort control | A wheel that types `/effort` into the session's console (decided 2026-11-13) | Waiting for a supported interface; an Effort key that cycles | Effort is an ordered scale, which suits a wheel. No hook or settings file can change it on a running session, and the console route was tested and works without window focus. It is unsupported and may break on an update |
| Agent privileges | Normal user | Nothing the core product needs | A network-listening program with admin rights is a larger risk |
| Launcher keys | Cut (2026-11-12) | Opening apps and sending hotkeys from the phone | A general Stream Deck feature, not part of answering agents; every key should do one agent action |
| Custom keys | Saved-reply keys only, at most two (decided 2026-11-13) | Macro, hotkey, and launcher keys | A saved reply is an agent action and reuses the route the spoken reply already has; it needs nothing new on the PC |
| Controls | Keys with fixed legends, plus one screen that lives in an island beside the camera | Controls that relabel themselves; keys that never move | The phone should feel like a device: a key clicks and the island changes. The island is closed most of the time, so the keys get the width |
| Keys and the island | Keys slide and narrow when the island opens (decided 2026-11-13) | Keys that stay in one place at all times | Wider keys at rest are worth more than fixed positions; the order and legends of keys never change |
| Agent scope | Claude Code, Codex, Cursor, Gemini, each behind an adapter, built in that order | Open-source and self-hosted agents | The deck must not be tied to one vendor |
| Conversation | Not shown, apart from the names of recent tool calls | Reading the agent's output on the phone | Your monitor is right there; Happy and HAPI already do this. Tool names already reach the deck through hooks |
| Other machines | Connect to HAPI, optional | A self-contained remote app | Away from the PC you need the conversation, which is a different product |

## What it does not do (by choice)

- **Move the pointer or act as a touchpad.**
- **Show a keyboard.** No typing on the phone at all.
- **Show your PC screen or the agent's conversation.** The island shows each session's status, its last few tool calls by name, and, for a request, the tool and command. It never shows what the agent wrote. The only text you compose is your own spoken reply.
- **Work over the internet in the main releases.** No relay, no cloud, no account.
- **Send notifications to a locked phone.** The app must be open.
- **Run agents, store transcripts, or act on its own.**
- **Support open-source agents, Mac or Linux PCs, or Android phones** in the releases below.

## What it cannot do (technical limits)

- **Be used silently for replies.** In a quiet office or a meeting, the only way to give an agent a custom answer is the PC keyboard.
- **Transcribe perfectly.** File names, flags, and code terms are often misheard, which is why nothing is sent before you see the transcript.
- **Send a new instruction to a session at any moment.** No agent documents a way for an outside program to message a session the person started in their own terminal or editor. The supported routes only reach sessions the outside program started itself. What does work is described under V-4.
- **Stop a running session from outside.** Not documented for any of the four agents' interactive sessions. A denial can stop Claude Code, but only at a permission prompt.
- **Change effort in the middle of a turn, or promise the wheel keeps working.** A new effort level applies to the next message. The wheel types into the session's console, which neither Microsoft nor Anthropic supports for this purpose, so an update to Claude Code can break it. It cannot reach a session with no console, such as one in the desktop app.
- **Behave identically across agents.** Claude Code and Codex ask the deck only when a permission prompt would appear. Cursor and Antigravity call the hook before every shell or tool call and expect it to decide, so the deck needs its own rule for what to pass silently.
- **Offer voice at no cost.** Every hold-to-talk option needs a development build, and installing one on an iPhone from Windows needs the paid Apple Developer account.
- **Guarantee an approval arrives.** If the hook connection times out, the request falls back to the normal prompt in the terminal.
- **Stay connected in the background.** iOS suspends the app when it is not on screen, so the phone stays awake and open while in use.
- **Work on networks that isolate devices,** such as many office, guest, and hotel Wi-Fi networks.
- **Be installed by other people at no cost to you.** Distribution beyond your own phone needs an Apple Developer account at $99 a year.

## Feasibility research (2026-11-12)

Read from each vendor's live documentation by research agents, with Perplexity as a cross-check. "Documented" means the vendor's page says it; nothing in this table has been tested yet.

| | Claude Code | Codex | Cursor | Gemini (now Antigravity) |
|---|---|---|---|---|
| Hooks for session status | Yes | Yes | Yes | Yes |
| Outside program can allow or deny | Yes, `PermissionRequest` hook | Yes, `PermissionRequest` hook, same shape as Claude Code | Yes, but the hook runs before every shell or MCP call, not when a prompt appears | Yes, `PreToolUse` hook, before every tool call |
| Denial carries a reason to the agent | Yes, `message` | Yes, `message` | Yes, `agent_message` | Yes, `reason` |
| Always Allow for the session | Yes, documented | Not confirmed | Not confirmed | `auto_approve` exists; scope not confirmed |
| Message a running session | Only as a follow-up when the turn ends (Stop hook) | Not confirmed for sessions the person started | Follow-up when the turn ends (`followup_message`), up to 5 in a row | Not for third-party programs |
| Native Windows | Yes | Yes | Yes | Likely, not stated on the hooks page |

Other findings that shape the design:

- **Hooks can call a local web address directly** in Claude Code (`type: "http"`), so no helper script is needed there. The default wait is 600 seconds. What happens to a permission request when the wait runs out is not documented, so A-6 must be tested.
- **Codex makes the person trust new hooks** with its `/hooks` command before they run, so connecting it cannot be fully one-click.
- **Cursor's hooks let the action through if the hook crashes or times out,** unless set to fail closed.
- **Google replaced Gemini CLI with Antigravity CLI** for unpaid and Google One users on 2026-06-18. The Gemini adapter should target Antigravity. Perplexity's answer that Gemini cannot grant a permission refers to the old CLI's notification hook; Antigravity's own hook can allow.
- **Voice:** `expo-speech-recognition` wraps Apple's recogniser, can be forced on-device, and accepts up to 100 hint phrases for technical words. Apple says on-device results are less accurate, and to plan for about one minute of audio. It does not run in Expo Go.
- **The only no-cost voice route is the iPhone keyboard's dictation key,** which needs a text field with the keyboard showing. That contradicts V-5.

### Tested on this PC (2026-11-13): typing into a session's console

Unlike the table above, this was run, not only read.

- **Method:** a background process attaches to the console of the session's process (`AttachConsole`) and writes key events into its input queue (`WriteConsoleInput`). Nothing passes through the keyboard or the focused window.
- **Result in a real session:** against Claude Code 2.1.323 in a minimized classic console, the process typed `/effort` and Enter, the effort slider opened, and a right-arrow followed by `s` gave "Set effort level to xhigh (this session only)". The user settings file was not changed.
- **Windows Terminal, VS Code, and Cursor terminals:** the same change worked in a real Claude Code session in each of the three, with the window minimized or unfocused.
- **Arrow keys must be sent as key records.** Sent as an escape sequence, the arrow worked in the classic console and Windows Terminal, but in VS Code's terminal it was read as Escape: the slider was cancelled and the next letter landed in the prompt box. Sent as a real arrow-key record it worked in VS Code and Cursor.
- **During a turn:** effort was changed while Claude Code ran a 40-second command. The slider opened over the running turn, the level changed, the turn finished normally, and `/effort` did not reach the model as text.
- **A draft in the prompt box:** typing `/effort` over a draft appends to it ("fix the login bug in/effort"). Sending Ctrl+S first stashes the draft; after the effort change Claude Code restored it by itself ("Draft restored"). Ctrl+S on an empty box with a stash brings the stash back, so the agent must know which state it is in.
- **Reading the screen back works:** the same attachment can read the console's visible text, which is how each result above was confirmed. A suggested prompt shown in an empty box reads the same as typed text.
- **Desktop-app sessions cannot be reached:** attaching to 15 Claude desktop-app processes failed with "no console" in every case.
- **Codex (0.169.0):** typed text reaches its prompt, `/model` opens "Select Model and Effort", and Escape closes it. Effort there is a second step after choosing a model; that step was not completed. A digit typed at Codex's update prompt started the update when the screen showed "Skip" as that digit, so Codex's key handling is not understood yet.
- **Documented timing:** the Claude Code documentation says `/effort` runs as soon as it is sent, even during a turn, and applies to the next message.
- **Why not a file or a hook:** the settings page lists `effortLevel` among the keys read once at session start, and no hook output sets effort.
- **Others use the same method:** `codex_stream_deck` and `claude_console` (open source, Windows) describe it in their READMEs; not run here.
- **Not supported by anyone:** Microsoft's page calls `WriteConsoleInput` not recommended, and an Anthropic collaborator wrote that no local interface exists for control commands (issue 85289).
- **Not tested:** an elevated terminal (it needs an administrator prompt answered at the PC); the user typing at the same moment as the wheel; a session over SSH or in WSL; completing an effort change in Codex; Cursor's own agent and Antigravity. These are G0-5.

Sources: [Claude Code model configuration](https://code.claude.com/docs/en/model-config), [Claude Code settings](https://code.claude.com/docs/en/settings), [Claude Code interactive mode](https://code.claude.com/docs/en/interactive-mode), [AttachConsole](https://learn.microsoft.com/en-us/windows/console/attachconsole), [WriteConsoleInput](https://learn.microsoft.com/en-us/windows/console/writeconsoleinput), [codex_stream_deck](https://github.com/neusse/codex_stream_deck), [claude_console](https://github.com/griffinbeels/claude_console), [Claude Code issue 85289](https://github.com/anthropics/claude-code/issues/85289).

Sources for the table: [Claude Code hooks](https://code.claude.com/docs/en/hooks.md), [Codex hooks](https://learn.chatgpt.com/docs/hooks), [Codex app-server](https://learn.chatgpt.com/docs/app-server), [Cursor hooks](https://cursor.com/docs/agent/hooks), [Antigravity hooks](https://antigravity.google/docs/hooks), [Gemini CLI hooks](https://geminicli.com/docs/hooks/reference/), [expo-speech-recognition](https://github.com/jamsch/expo-speech-recognition), [Expo development builds](https://docs.expo.dev/develop/development-builds/create-a-build/), [Apple on-device recognition](https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/requiresondevicerecognition).

## Functional requirements

Each release is usable on its own.

### Gate 0: spike before development

- **G0-1** A blank Expo app pairs with a script on the PC over the local network and exchanges encrypted messages.
- **G0-2** One Claude Code permission request travels to the phone and an Allow or Deny travels back through the hook.
- **G0-3** Test what the documentation says: a denial with a `message` reaches Claude Code and changes what it does next, and a Stop hook can hand it a queued follow-up. Also record what happens when the hook's wait runs out.
- **G0-4** Answered by research: on-device speech needs a development build and the paid Apple account. Releases 1 and 2 need neither. Test recognition accuracy on technical words once the account exists.
- **G0-5** Finish the console-typing test for the effort wheel. Done on 2026-11-13: Windows Terminal, VS Code, and Cursor terminals; a change during a turn; a draft in the prompt box. Still to do: an elevated terminal; the user typing at the same moment; how the PC agent finds a session's process from its hooks; whether a hook reports the session's current effort level; and whether the stash state can be told reliably before Ctrl+S is sent.

### Release 1: connection and the device

Connection
- **C-1** Pair by scanning a QR code shown by the PC agent; the phone stores the pairing and reconnects without rescanning.
- **C-2** All traffic is encrypted with a key established at pairing.
- **C-3** The agent accepts input only from paired phones, and pairings can be revoked on the PC.
- **C-4** The phone shows connection state and reconnects automatically after sleep or a network drop.
- **C-5** The agent runs as a normal user, starts with Windows, and lives in the system tray.

Device (replaces the launcher requirements D-1 to D-5, which are cut)
- **K-1** The phone shows a set of keys and one island: a black area the app draws around the camera cutout. Everything that changes (sessions, requests, transcripts, results) appears only in the island.
- **K-2** Each key does one action and carries a fixed legend: a word, with a small plain glyph on action keys, as on a Mac keyboard. No key shows an app icon or logo, and no key changes its legend or its place in the order during use. Keys do slide and change width together when the island opens or closes (K-7).
- **K-3** A key that does nothing in the current state is unlit. Outside the island, only lights change.
- **K-4** A press is confirmed with a haptic and a visible press movement. It should feel deep and heavy, like a glass key that goes down firmly and comes back slowly, not a light click (the user, 2026-11-13; handoff T6b). Chosen by feel on the phone from four variants (2026-11-13): a heavy haptic as the finger lands and a soft one as it lifts; the key goes down 3 points and springs back in about 0.7 seconds, rising slightly past rest once.
- **K-5** The island responds to touch: tap the closed island to open the session list, tap a row to open that session, tap an open island to close it, swipe to change the page of sessions, and scroll a long command. A request is never answered by touching the island; only keys answer.
- **K-6** A layout mode on the phone lets the user choose which keys exist and where they sit, on a grid. Keys are added, removed, or reordered only in this mode. Allow and Deny cannot be removed. Redirect, Cancel, and Send form one group that is added and removed together. Number keys (K-10) and the saved-reply keys (R-1) are added and removed here. The mode opens with a touch and hold on the plate and closes with Done; a removed key can be put back from an Add a Key list. The island has a fixed size and is not part of the layout.
- **K-7** Closed, the island is a small pill beside the camera showing one glyph and one count: sessions, or waiting requests in amber. It opens by itself for a request, while listening, and for a transcript, and it opens half-height for about two seconds to confirm a result (allowed, denied, sent, session started or finished). When it opens, the keys slide aside and narrow; when it closes, they return.
- **K-8** The island follows the camera: with the left- or right-handed setting (P-1) it sits on whichever side the camera is. Measured on the iPhone 17 (2026-11-13): the screen is 874 by 402 points in landscape with 62-point insets at both ends, and the cutout is about 37 by 125 points, 14 to 51 points in from the camera edge and centred top to bottom (figures in docs/HANDOFF.md). Other iPhones are not measured.

- **K-9** The plate carries one effort wheel on its edge, drawn as hardware in a fixed place. Its marking never changes; the level it sets is shown in the island. A light beside it is on when the wheel will act on the selected session. It can be removed and put back in layout mode. What it does is in E-1 to E-7.
- **K-10** The deck has six number keys, set as a pad three wide and two high. Any of them can be removed in layout mode. The session list shows one row for each number key on the deck (A-2).
- **K-11** Keys sit on a grid of five columns and four rows, so that with the island open a single key is about as wide as it is tall (decided 2026-11-13). Allow is two cells wide and two high; Deny, Redirect, and Send are two cells wide; every other key is one cell. The answer keys are on the right, the saved-reply keys under the number pad, and Redirect, Cancel, and Send along the bottom.

With Release 1 alone the device pairs and shows an empty island; it becomes useful with Release 2. The two are built together.

Phone
- **P-1** Landscape by default, with a setting for left- or right-handed orientation. Portrait is an open question (see Open decisions).
- **P-2** The screen stays awake while connected.

### Gate 1: before building the agent strip

- **G1-1** Try Stream Deck Mobile's free tier with one Windows-capable approval plugin for a week, and write down what it lacks.
- **G1-2** From live documentation, record for Codex, Cursor, and Gemini how an outside program can read session status and answer a permission request (hooks, a local API, or neither).

### Release 2: agent strip (Claude Code)

- **A-1** One button on the PC installs Claude Code hooks beside any existing ones, backs up the settings file first, and removes them cleanly.
- **A-2** Each running session appears automatically as a numbered row in the island's session list, labelled with its project folder. The deck does not start sessions; they are started on the PC. The list shows one row for each number key on the deck (six unless some are removed, K-10), and a swipe shows the next page.
- **A-3** A row shows one of four states: working, needs approval, finished, idle. State is shown by colour, icon, and label. The number key for that row carries a light in the same colour.
- **A-4** A permission request opens the island by itself, showing the session, the tool, and the exact command. It is answered with the Allow, Always Allow (this session only), and Deny keys. When several requests wait, they are shown one at a time, oldest first, with a count. A request can be hidden with a tap; the answer keys work only while the request is showing, and the first press of one while it is hidden shows it again.
- **A-5** The answer keys light up a short moment after a request appears, and a press before that is ignored, so you cannot approve something you have not read.
- **A-6** If no answer arrives in time, the request falls back to the prompt in the terminal.
- **A-7** Pressing a number key, or tapping its row, selects that session, opens it in the island, and brings its window to the front.
- **A-14** A selected session's view shows its last three tool calls by tool name and target (for example "Bash: npm test"), taken from hooks. It shows no text written by the agent.
- **A-8** A session that needs approval is visible whatever the island was showing: closed, the pill turns amber with a count, the request light is on, and the session's number key glows amber.
- **A-9** Agent support sits behind an adapter so another agent can be added without changing the phone app.

Effort wheel (Claude Code; depends on G0-5)
- **E-1** Turning the wheel changes the reasoning effort of the selected session, one level for each step, with a haptic tick at each step and a firmer stop at each end. The levels are the ones that session's model offers (for example low, medium, high, xhigh, max).
- **E-2** While the wheel turns, the island opens half-height and shows the session, its current level, and the level chosen. It closes about two seconds after the result.
- **E-3** The change is sent once, a short moment after the wheel stops, not once for each step.
- **E-4** The change applies to that session only and does not alter the saved default on the PC. It takes effect on the next message; the island says so, and a turn in progress is not interrupted.
- **E-5** The PC agent delivers the change by typing into the session's console, without bringing its window to the front. It then confirms the new level from what Claude Code reports. If it cannot confirm, the island says "Not changed" and shows the level still in force.
- **E-6** The wheel is unlit, and turning it does nothing, when no session is selected, when the selected session is waiting on a permission request (typed keys would answer the prompt in the terminal), or when the session cannot be reached this way: no console (the desktop app), an elevated terminal, or an agent this route has not been tested on.
- **E-7** The wheel must not corrupt text the user is typing on the PC. Before typing, the PC agent stashes any draft in the prompt box (Ctrl+S), and after the change it checks that Claude Code restored it. Arrow keys are sent as key records, never as escape sequences. If the agent cannot tell what state the prompt box is in, the change is not sent and the island says "Not changed".

### Release 3: voice

- **V-1** Holding the Redirect key records speech, and the phone transcribes it on the device. No audio or text goes to any server.
- **V-2** The transcript is shown in the island before anything is sent. The Send key delivers it; the Cancel key discards it; holding Redirect again replaces it.
- **V-3** While a permission request is showing, the spoken reply is sent with a denial, so the agent learns what to do instead.
- **V-4** With no request waiting, the spoken reply goes to the selected session if it is working: it is queued and handed to the agent when its current turn ends. The row shows that a follow-up is waiting, and it can be cancelled. A session that is already idle cannot receive one; the phone says so.
- **V-7** Project and file names from the session's folder are given to the recogniser as hint phrases, to improve accuracy on technical words.
- **V-5** The app has no on-screen keyboard. A transcript is corrected by recording again, or the reply is typed on the PC.
- **V-6** Transcripts are not stored on the phone or the PC after they are sent or cancelled.

Saved-reply keys (depend on the Redirect, Cancel, and Send group)
- **R-1** Up to two saved-reply keys can be added in layout mode. Each holds one reply. The reply and its legend (at most two short words) are written on the PC, in a Saved Replies section of the PC agent's window, and a change reaches the phone at once. The phone cannot edit either, because it has no keyboard. The legend does not change during use (K-2).
- **R-2** Pressing a saved-reply key sends nothing. It puts the reply's text in the island, as a transcript is shown (V-2). The Send key delivers it and the Cancel key discards it.
- **R-3** A saved reply is delivered exactly as a spoken one: with a denial while a request is showing (V-3), or queued for the end of the turn when the selected session is working (V-4). It has the same limit: a session that is already idle cannot receive one.
- **R-4** A saved-reply key is unlit whenever Redirect would do nothing. Removing the Redirect, Cancel, and Send group removes the saved-reply keys with it.
- **R-5** Saved replies are stored on the PC and are not covered by V-6. They need no speech recognition, so they do not depend on the Apple developer account.

### Release 4: more agents

- **A-10** The strip supports Codex, Cursor, and Gemini (through Antigravity, its replacement), each through its own adapter, in that order. Codex comes first because its hook has the same shape as Claude Code's. Open-source and self-hosted agents are out of scope.
- **A-13** For Cursor and Antigravity, whose hooks fire before every call, the deck passes read-only and already-allowed calls silently and holds the rest for the phone. The rule is visible and editable on the PC, and the hook is set to block, not pass, if the deck cannot be reached.
- **A-11** Every row in the screen shows which agent it belongs to with that agent's icon, and sessions from different agents behave the same way (A-3 to A-8, V-3, V-4) wherever the agent's interface allows it.
- **A-12** Agents are connected and removed one by one on the PC; A-1's rules (back up, never overwrite, remove cleanly) apply to each.

Release 4 is the end of the core product.

## Stretch goals

None of these start until Releases 1 to 4 are in daily use.

### Rules for admitting a stretch goal

1. **No server run by the project.**
2. **It stays a deck.** Nothing that shows the conversation or the PC screen, and no keyboard.
3. **One at a time,** each shippable alone.
4. **It reuses what exists.**

### S1: agent action keys

- **S1-1** A Stop key interrupts the selected session.
- **S1-2** Moved into Release 3 on 2026-11-13 as the saved-reply keys (R-1 to R-5).
- **S1-3** A key runs a slash command, such as `/compact`.

Scope: research found no documented way to stop or message an interactive session from outside, other than the end-of-turn follow-up in V-4. S1-1 and S1-3 would have to type into the session's console. That route was tested for effort only (see Feasibility) and does not need window focus; it has not been tested for stopping a session or for other commands.

### S2: model switching

- **S2-1** A Model key cycles the selected session to its next model. The current model is shown in the island, not on the key.

Effort moved out of this stretch goal on 2026-11-13 and is now the wheel in E-1 to E-7.

Scope: research found no documented way for an outside program to change the model of a session the person started, so this would type `/model` into the session's console, the same route as the effort wheel. That route has not been tested for `/model`. It is likely to break across agent updates.

### S3: HAPI connection

- **S3-1** The PC agent can connect to a HAPI hub as a client, on this PC or at an address the user enters.
- **S3-2** Sessions the hub knows about, on any machine, appear as tiles with the same states.
- **S3-3** A pending permission request from the hub can be answered from a tile, with the same safety rules as A-4 to A-6.
- **S3-4** Tiles are marked with their machine when it is not this PC.
- **S3-5** The agent checks the hub's protocol version on connect and turns the connection off with a clear message if it does not match.
- **S3-6** HAPI stays optional.

How it fits: the phone still talks only to the PC agent over local Wi-Fi; the PC agent talks to the hub. The user must install HAPI and start sessions through it (`hapi claude`).

Checked: HAPI publishes a client contract for "any other non-web client", with a protocol version and endpoints for listing sessions with pending requests, sending messages, and aborting. Not checked: the exact endpoint for answering a permission request.

Licence: HAPI is AGPL-3.0. Talking to a hub over its network interface is using it, not copying it. This is not legal advice.

### S4: touchpad mode

- **S4-1** A mode that turns the screen into a pointer and scroll surface, for a PC connected to a TV or for presenting.

Scope: for a different situation than the core product. It brings back gesture injection and the admin-window limit, so it needs its own spike.

### S5: Android phone

- **S5-1** The same app runs on Android with the same features.

### S7: alerts on a locked phone

- **S7-1** A waiting agent is visible on the lock screen. Ship only if a route exists that needs no server run by the project.

### Considered and left out

- **A phone keyboard.** Replaced by voice, on purpose.
- **Launcher and hotkey keys, and app icons on keys.** Cut on 2026-11-12. With them went the signed agent for administrator windows (formerly S6).
- **Our own remote deck and Linux agent.** Replaced by the HAPI connection in S3.
- **Mac or Linux as the main PC.**
- **Usage and limit tiles.** Monitoring, not control.
- **Reading the conversation, and screen viewing.**

## Non-functional requirements

- **N-1 Cost:** nothing to run. No servers, accounts, analytics, or subscriptions. The one cost is Apple's developer fee, from Release 3 on.
- **N-2 Speed:** a request appears on the phone, and an answer reaches the agent, without a wait you notice on home Wi-Fi; the measured target is set in the spike.
- **N-3 Privacy:** nothing leaves the local network; speech is transcribed on the phone; commands and transcripts are not stored.
- **N-4 Safety:** the hook installers never overwrite a user's existing hooks, and uninstalling restores the original file.
- **N-5 Look:** the number keys are Liquid Glass in the "clear" style tinted 25% black, over a coloured glow when lit; the other keys are solid dark caps and Allow is solid blue, as in the mockups (applied in handoff T6). Under the glass the glow is softer than the mockup's, 0.7 as strong and centred on the key, and a pale face sits under the glass so an unlit key is grey rather than black (both chosen by the user from phone screenshots, 2026-11-13; the glass otherwise spreads the glow across the whole cap) (chosen by the user on 2026-11-13 from samples on the phone, handoff T5). The tint keeps the clear glass's glossy, heavy look while giving the legend a darker backdrop; untinted clear glass let the glow wash out the legend. Runner-up: "regular" glass, cleaner and easier to read but more milky; a Skia-drawn blur came after. This goes beyond Apple's advice to keep Liquid Glass to floating controls, on purpose: the deck is meant to look like glass keycaps. Liquid Glass needs iOS 26 or later; what older iPhones and Android (S5) show instead is not decided. One tinted primary action per screen, and status never shown by colour alone.

## Open decisions

1. **Landscape or portrait.** Landscape came from the touchpad. A deck beside a keyboard may read better in portrait.
2. **Open source, and under which licence.**
3. **Apple's $99 a year: decided 2026-11-12.** Pay when Release 3 (voice) starts. Releases 1 and 2 are built and used free in Expo Go. Keyboard dictation was rejected because it breaks the no-keyboard rule. Updated 2026-11-13: the user will pay now and use development builds from the start, so the speech library is installed from day one; Expo Go is used only until the account is active.
4. **The name.**
5. **How far to use console typing.** It is approved for the effort wheel only. The same route might also stop a session, switch model, or send a follow-up to an idle session, which this brief still lists as not possible (see "What it cannot do", V-4, S1, S2). None of those is tested or decided.
6. **Effort on other agents.** E-1 to E-7 cover Claude Code. Whether Codex, Cursor, and Antigravity have an effort setting that can be changed the same way is not researched.
7. **A key-material setting (idea, not a requirement).** The user suggested on 2026-11-13 a theme option to switch the keys between tinted clear glass, regular glass, and the plainer Skia look. Not scheduled; it would need to pass the stretch-goal rules first.
