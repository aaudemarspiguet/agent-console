# Design mockups

The design boards for the phone deck and the PC agent's window. They are the visual target for `apps/mobile`.

## Files

- `project/canvas.json`: the canvas. It lists every board with its position and title.
- `project/Island*.dc.html`, `Effort*.dc.html`, `Reply*.dc.html`: phone boards. **Generated; do not edit by hand.**
- `project/Desktop*.dc.html`: PC boards. Written by hand; edit them directly.
- `gen-island.ps1`: generates every phone board. It loads `gen-flow.ps1` first for shared styles and helpers.
- `gen-flow.ps1`: the shared key styles. It also writes older "Flow" boards, which `gen-island.ps1` deletes again.

## Regenerate the phone boards

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File design/mockups/gen-island.ps1
```

The last line it prints must show `left tokens: 0`.

## Rules for editing the generators

- **Keep them ASCII.** A non-ASCII character in a here-string has broken the output before.
- **Placeholders are `@@NAME@@`** and are filled by plain text replacement. A leftover `@@` in a board is a bug.
- **Files are written as UTF-8 without a byte-order mark.**
- **Board size is 874 by 402 points,** the iPhone 17 in landscape as measured in T1 (`docs/HANDOFF.md`).

## Geometry in use

- Key grid: five columns by four rows, 9-point gaps.
- Island closed: a pill 37 by 125 at x 14, y 139, the iPhone 17's measured cutout; the hidden-request pill is 37 by 164, centred on the same line. Open: 320 by 378, 12 points from top and bottom. Half height: 320 by 170, centred. All start 14 points from the camera edge.
- Camera dot: centred on the cutout's centre, x 32, y 201.
- Effort wheel: centred top to bottom (top 100).
- Key area: starts 62 points from the camera edge when the island is closed and 348 when it is open; ends 62 points from the other edge, where the effort wheel sits.

## Publish to the canvas

The canvas is the artifact at https://claude.ai/artifact/13hkDcihBpCLtnBrE9AEk8. Publish with the Artifact tool, passing:

- `url`: the address above.
- `root`: this folder (`design/mockups`).
- `file_path`: `project/canvas.json`.
- `files`: a map of each changed board to itself, for example `"project/Island1.dc.html": "project/Island1.dc.html"`.

If a publish is refused because a file was not read first, read that file from the artifact and publish again. The canvas type's own rule is that a session does not open the render unless the user asks, so say plainly in the reply whether the render was viewed.

## Comparing a board with the app

`make-compare.ps1` writes every phone board as a plain page to `compare/` (ignored by git) and a page that shows one board above the running app. See T2 in `docs/HANDOFF.md`.

## Checking a board without the canvas

The canvas needs a sign-in the built-in browser may not have. To check boards locally, copy each board's `<style>` block and the markup between `</helmet>` and `</x-dc>` into one plain HTML page and serve it from a local server. Agent icons will not load there; everything else renders.
