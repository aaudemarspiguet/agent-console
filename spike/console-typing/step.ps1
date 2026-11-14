param([int]$p, [string]$arrow = '{L}')
# One effort-wheel step as tested in T9: stash + /effort + Enter in ONE write (so keys typed at the
# PC cannot land between them), wait until the slider is on screen, then arrow + s in one write.
# 's' sets the level for this session only; Enter on the slider would save it as the user's default.
# Does NOT check the stash state first (see README): only use it on a session with no "stashed" marker.
# Types into a real session. Read the README before running it.
. "$PSScriptRoot\lib.ps1"
function T { (Get-Date).ToString('HH:mm:ss.fff') }
"=== $(T) before"; Screen $p 4
Key $p '\x13/effort\x0d'
$ok = $false; for ($i = 0; $i -lt 10 -and -not $ok; $i++) { $s = Screen $p 3; $ok = ($s -join ' ') -match 'this session only' }
"=== $(T) slider open: $ok"
if ($ok) { Key $p "${arrow}s" }
Start-Sleep 1; "=== $(T) after"; Screen $p 6
