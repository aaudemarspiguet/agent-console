$d = $PSScriptRoot
$script:n = 0
# Type text into the console of process $p (no focus). Returns nothing.
function Key($p, $text, [switch]$enter) {
  $script:n++
  $a = @('-NoProfile','-ExecutionPolicy','Bypass','-File',"$d\inject.ps1",'-TargetPid',$p,'-Text',('"' + $text + '"'),'-Log',"$d\k$($script:n).log")
  if ($enter) { $a += '-Enter' }
  Start-Process powershell -ArgumentList $a -WindowStyle Hidden -Wait
}
# Read the visible console text of process $p, ASCII only so box characters do not flood the output.
function Screen($p, $last = 30) {
  $a = @('-NoProfile','-ExecutionPolicy','Bypass','-File',"$d\inject.ps1",'-TargetPid',$p,'-Text','""','-Log',"$d\screen.log",'-Screen')
  Start-Process powershell -ArgumentList $a -WindowStyle Hidden -Wait
  $t = [IO.File]::ReadAllLines("$d\screen.log", [Text.Encoding]::UTF8)
  $t | ForEach-Object { ($_ -replace '[^\x20-\x7E]', '').TrimEnd() } | Where-Object { $_.Trim().Length -gt 0 } | Select-Object -Last $last
}
function ClaudePids { @(Get-Process claude -ErrorAction SilentlyContinue | ForEach-Object { $_.Id }) }
