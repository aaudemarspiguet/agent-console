# Builds a local comparison page: each phone board as a plain HTML page, and
# index.html that shows one board above the running app (Expo web on port 8090).
# Output goes to design/mockups/compare (ignored by git). Keep this file ASCII.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File design/mockups/make-compare.ps1
#
# Then start "mockups" and "deck-web" from .claude/launch.json and open
# http://localhost:8091/compare/

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$src = Join-Path $root 'project'
$out = Join-Path $root 'compare'
New-Item -ItemType Directory -Force $out | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding $false

$canvas = Get-Content (Join-Path $src 'canvas.json') -Raw -Encoding UTF8 | ConvertFrom-Json
# Boards in canvas order; canvas.json keys each board by its file name.
$boards = New-Object System.Collections.Generic.List[object]
$titles = @{}
foreach ($p in $canvas.boards.PSObject.Properties) {
  if ($p.Name -like 'Desktop*') { continue }
  $boards.Add((Get-Item (Join-Path $src $p.Name)))
  $titles[$p.Name -replace '\.dc\.html$', ''] = $p.Value.title
}
$options = New-Object System.Collections.Generic.List[string]
foreach ($b in $boards) {
  $name = $b.Name -replace '\.dc\.html$', ''
  $html = [System.IO.File]::ReadAllText($b.FullName, $utf8)
  $head = [regex]::Match($html, '(?s)<helmet>(.*?)</helmet>').Groups[1].Value
  $body = [regex]::Match($html, '(?s)</helmet>(.*?)</x-dc>').Groups[1].Value
  if (-not $body) { throw "No board markup in $($b.Name)" }
  $page = "<!doctype html>`n<html lang=`"en`">`n<head>`n<meta charset=`"utf-8`">`n<title>$name</title>`n$head`n</head>`n<body style=`"background:#000`">$body</body>`n</html>`n"
  [System.IO.File]::WriteAllText((Join-Path $out "$name.html"), $page, $utf8)
  $label = if ($titles.ContainsKey($name)) { $titles[$name] } else { $name }
  $label = [System.Net.WebUtility]::HtmlEncode($label)
  $options.Add("<option value=`"$name`">$label</option>")
}

$index = @'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Deck vs mockup</title>
<style>
  body { margin: 0; background: #000; color: #8E8E93; font: 12px system-ui, sans-serif; }
  .bar { display: flex; gap: 8px; align-items: center; padding: 6px 8px; }
  select { font: inherit; }
  .lbl { padding: 4px 8px 2px; }
  iframe { display: block; border: 0; }
</style>
</head>
<body>
<div class="bar">
  <label>Board <select id="board">@@OPTIONS@@</select></label>
  <span>Mockup 844 x 390 (top) | App 874 x 402 at http://localhost:8090 (bottom)</span>
</div>
<div class="lbl">Mockup</div>
<iframe id="mock" width="844" height="390"></iframe>
<div class="lbl">App (web view; not iOS)</div>
<iframe id="app" src="http://localhost:8090" width="874" height="402"></iframe>
<script>
  var sel = document.getElementById('board');
  var mock = document.getElementById('mock');
  var q = new URLSearchParams(location.search).get('board');
  if (q) sel.value = q;
  function show() { mock.src = sel.value + '.html'; history.replaceState(null, '', '?board=' + sel.value); }
  sel.onchange = show;
  show();
</script>
</body>
</html>
'@
$index = $index.Replace('@@OPTIONS@@', ($options -join "`n"))
[System.IO.File]::WriteAllText((Join-Path $out 'index.html'), $index, $utf8)
$left = (Get-ChildItem $out -Filter '*.html' | Select-String -Pattern '@@' -SimpleMatch).Count
Write-Output "wrote $($boards.Count) boards and index.html to $out; left tokens: $left"
