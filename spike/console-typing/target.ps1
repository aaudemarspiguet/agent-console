param([string]$Dir)
# Stands in for a terminal app in raw mode: reads single keys, no line editing.
Set-Content -Path (Join-Path $Dir 'target.pid') -Value $PID -Encoding ascii
$sb = New-Object Text.StringBuilder
while ($true) {
  $k = [Console]::ReadKey($true)
  if ($k.Key -eq 'Enter') { break }
  [void]$sb.Append($k.KeyChar)
}
Set-Content -Path (Join-Path $Dir 'target.out') -Value $sb.ToString() -Encoding ascii
