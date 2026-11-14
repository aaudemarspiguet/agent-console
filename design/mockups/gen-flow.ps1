$out = Join-Path $PSScriptRoot 'project'

$head = @'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>@@TITLE@@</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
body{margin:0}
button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.plate{background-color:#232326;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.028) 0 1px,transparent 1px 3px),linear-gradient(180deg,#2C2C30,#19191B)}
.well{position:relative;display:flex;padding:3px 3px 6px;border-radius:13px;background:#040405;box-shadow:inset 0 2px 4px rgba(0,0,0,.95),0 1px 0 rgba(255,255,255,.10)}
.ring{outline:2px solid rgba(255,255,255,.92);outline-offset:2px}
.glow{position:absolute;left:20%;right:20%;top:32%;bottom:16%;border-radius:50%;filter:blur(14px);opacity:.8}
.key{position:relative;flex:1 1 0;min-width:0;padding:0;border-radius:10px;color:#fff;border:1px solid rgba(255,255,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.15),rgba(255,255,255,.08));-webkit-backdrop-filter:blur(14px) saturate(1.7);backdrop-filter:blur(14px) saturate(1.7);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),inset 0 -5px 9px rgba(0,0,0,.2),0 3px 0 #1A1A1D,0 5px 8px rgba(0,0,0,.6);transition:transform .06s ease-out,box-shadow .06s ease-out;display:flex;align-items:center;justify-content:center}
.key.solid{border-color:rgba(255,255,255,.05);background:linear-gradient(180deg,#2D2D30,#29292C);-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 3px 0 #111113,0 5px 8px rgba(0,0,0,.6)}
.key:active,.key.down{transform:translateY(2px);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),inset 0 -3px 6px rgba(0,0,0,.3),0 1px 0 #1A1A1D,0 1px 3px rgba(0,0,0,.6)}
.key.tint{border-color:rgba(255,255,255,.08);background:linear-gradient(180deg,#1A88F7,#1480EE);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 3px 0 #0A4FA3,0 5px 8px rgba(0,0,0,.6)}
.key.solid:active,.key.solid.down{background:linear-gradient(180deg,#2A2A2D,#27272A);box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 1px 0 #111113,0 1px 3px rgba(0,0,0,.6)}
.key.tint:active,.key.tint.down{background:linear-gradient(180deg,#1683F0,#127BE6);box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 1px 0 #0A4FA3,0 1px 3px rgba(0,0,0,.6)}
.key.off{color:rgba(255,255,255,.3)}
.key.tint.off{border-color:rgba(255,255,255,.05);color:rgba(255,255,255,.42);background:linear-gradient(180deg,#1F4573,#1B3F69);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 3px 0 #0C2748,0 5px 8px rgba(0,0,0,.6)}
.num{font-size:24px;line-height:29px;font-weight:400;letter-spacing:.2px}
.leg{position:absolute;bottom:9px;font-size:13px;line-height:16px;font-weight:500;letter-spacing:-.08px;text-align:left}
.leg.l{left:11px}
.leg.r{right:11px;text-align:right}
.alt{position:absolute;top:9px;right:11px;font-size:11px;line-height:13px;font-weight:400;letter-spacing:.06px;opacity:.55}
.gl{position:absolute;top:9px;width:15px;height:15px;opacity:.85}.gl.l{left:10px}.gl.r{right:10px}
.dot{position:absolute;top:10px;left:11px;width:6px;height:6px;border-radius:50%}
.bezel{background:linear-gradient(180deg,#0C0C0D,#050506);box-shadow:inset 0 2px 6px rgba(0,0,0,1),0 1px 0 rgba(255,255,255,.12)}
.silk{font-size:10px;line-height:12px;font-weight:500;letter-spacing:1.1px;text-transform:uppercase;color:rgba(255,255,255,.6)}
.screw{width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#6A6A70,#2A2A2D 70%);box-shadow:inset 0 0 0 1px rgba(0,0,0,.6),0 1px 0 rgba(255,255,255,.12);position:relative}
.screw::after{content:"";position:absolute;left:2px;right:2px;top:5.5px;height:1px;background:rgba(0,0,0,.75);transform:rotate(35deg)}
.led{width:8px;height:8px;border-radius:50%;outline:2px solid #050506}
.row{display:flex;align-items:center;gap:10px;height:52px;padding:0 8px;border-radius:12px}
.n{width:10px;font-size:13px;line-height:18px;color:rgba(235,235,245,.6)}
.nm{font-size:15px;line-height:20px;font-weight:500;letter-spacing:-.23px}
.st{font-size:12px;line-height:16px;color:rgba(235,235,245,.6)}
.foot{display:flex;align-items:center;gap:6px;font-size:12px;line-height:16px;color:rgba(235,235,245,.6)}
.pd{width:6px;height:6px;border-radius:50%;background:rgba(235,235,245,.3)}
@media (prefers-reduced-transparency: reduce){.key{background:#2C2C2E;-webkit-backdrop-filter:none;backdrop-filter:none}}
@media (prefers-reduced-motion: reduce){.key{transition:none}}
</style>
</helmet>
<div class="plate" style="width: 874px; height: 402px; box-sizing: border-box; padding: 16px 62px 21px; color: #FFFFFF; font-family: -apple-system, 'SF Pro Text', 'SF Pro Display', Inter, system-ui, sans-serif; display: flex; gap: 14px">
  <div class="bezel" style="width: 290px; box-sizing: border-box; padding: 8px; border-radius: 24px; display: flex">
    <div style="flex-grow: 1; min-width: 0; box-sizing: border-box; padding: 14px 8px 12px; border-radius: 16px; background: #000000; border: 1px solid rgba(255,255,255,.06); display: flex; flex-direction: column">
@@SCREEN@@
    </div>
  </div>
  <div style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 9px">
    <div style="height: 26px; display: flex; align-items: center; gap: 8px">
      <span class="screw" aria-hidden="true"></span>
      <span class="silk">Link</span>
      <span class="led" role="img" aria-label="Connected" style="background: #30D158; box-shadow: 0 0 8px #30D158, inset 0 1px 1px rgba(255,255,255,.6)"></span>
      <div style="flex-grow: 1"></div>
      <span class="silk">Request</span>
      <span class="led" role="img" aria-label="@@REQLABEL@@" style="@@REQLED@@"></span>
      <span class="screw" aria-hidden="true"></span>
    </div>
    <div style="flex-grow: 1; min-height: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(3, minmax(0, 1fr)); gap: 9px">
      <div class="well@@W_k1@@">
        <span class="glow" aria-hidden="true" style="@@K1GLOW@@"></span>
        <button class="key@@C_k1@@" aria-label="Session 1"><span class="dot" style="@@K1DOT@@"></span><span class="num">1</span></button>
      </div>
      <div class="well@@W_k2@@">
        <span class="glow" aria-hidden="true" style="background: #30D158"></span>
        <button class="key@@C_k2@@" aria-label="Session 2"><span class="dot" style="background: #30D158; box-shadow: 0 0 7px #30D158"></span><span class="num">2</span></button>
      </div>
      <div class="well@@W_k3@@">
        <button class="key@@C_k3@@" aria-label="Session 3"><span class="dot" style="background: #48484A"></span><span class="num">3</span></button>
      </div>
      <div class="well@@W_k4@@">
        <span class="glow" aria-hidden="true" style="background: #FFFFFF; opacity: .32"></span>
        <button class="key@@C_k4@@" aria-label="Session 4"><span class="dot" style="background: #FFFFFF; box-shadow: 0 0 7px #FFFFFF"></span><span class="num">4</span></button>
      </div>
      <div class="well@@W_deny@@">
        <button class="key solid@@C_deny@@"><svg class="gl l" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg><span class="leg l">deny</span></button>
      </div>
      <div class="well@@W_always@@">
        <button class="key solid@@C_always@@" aria-label="Always allow for this session"><span class="leg l">always<br>allow</span></button>
      </div>
      <div class="well@@W_allow@@" style="grid-column: span 2">
        <button class="key tint@@C_allow@@"><svg class="gl r" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span class="leg r">allow</span></button>
      </div>
      <div class="well@@W_red@@" style="grid-column: span 2">
        <button class="key solid@@C_red@@" aria-label="Redirect, hold to talk"><svg class="gl l" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg><span class="alt">hold to talk</span><span class="leg l">redirect</span></button>
      </div>
      <div class="well@@W_cancel@@">
        <button class="key solid@@C_cancel@@"><span class="leg l">cancel</span></button>
      </div>
      <div class="well@@W_send@@">
        <button class="key solid@@C_send@@"><svg class="gl r" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V5M5 12l7-7 7 7"/></svg><span class="leg r">send</span></button>
      </div>
    </div>
  </div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":874,"height":402}}'>
class Component extends DCLogic {
renderVals() {
return {};
}
}
</script>
</body>
</html>
'@

$grey = 'rgba(235,235,245,.6)'
$spin = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9"/></svg>'
$check = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#30D158" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
$pause = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(235,235,245,.6)" stroke-width="2.4" stroke-linecap="round"><path d="M9 6v12M15 6v12"/></svg>'
$queued = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/></svg>'

function Row($n, $blob, $agent, $name, $status, $statusColor, $icon, $bg) {
  return @"
      <div class="row" style="background: $bg">
        <span class="n">$n</span>
        <img src="/_blob/$blob" alt="$agent" style="width: 26px; height: 26px; border-radius: 7px; object-fit: contain">
        <span style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column"><span class="nm">$name</span><span class="st" style="color: $statusColor">$status</span></span>
        $icon
      </div>

"@
}

$listFoot = @'
      <div style="flex-grow: 1"></div>
      <div class="foot" style="padding: 0 8px">
        <span>AMOGH-PC on Wi-Fi</span>
        <span style="flex-grow: 1"></span>
        <span role="img" aria-label="Page 1 of 2, swipe to change" style="display: flex; gap: 5px"><span class="pd" style="background: #FFFFFF"></span><span class="pd"></span></span>
      </div>
'@

function ListScreen($r1Status, $r1Color, $r1Icon, $r1Bg, $r4Status, $r4Icon, $r4Bg) {
  return '      <span style="font-size: 17px; line-height: 22px; font-weight: 600; letter-spacing: -0.43px; padding: 0 8px 8px">Agents</span>' + "`n" +
    (Row 1 'd7ab54a8b06e30381ffe0e33e226ca6b' 'Claude Code' 'api-server' $r1Status $r1Color $r1Icon $r1Bg) +
    (Row 2 'cdb4ae4ed7eaf4554a2d52b0ee82d3ba' 'Codex' 'web-app' 'Finished' '#30D158' $check 'transparent') +
    (Row 3 '48fc1865b1f7a5ae46167a5baec1e980' 'Cursor' 'docs-site' 'Idle' $grey $pause 'transparent') +
    (Row 4 '59c30899253baf3d4871a721e8250440' 'Gemini' 'infra' $r4Status $grey $r4Icon $r4Bg) + $listFoot
}

$reqHead = @'
      <div style="display: flex; align-items: center; gap: 10px; padding: 0 8px">
        <span class="n">1</span>
        <img src="/_blob/d7ab54a8b06e30381ffe0e33e226ca6b" alt="Claude Code" style="width: 28px; height: 28px; border-radius: 7px; object-fit: contain">
        <span style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column"><span style="font-size: 17px; line-height: 22px; font-weight: 600; letter-spacing: -0.43px">api-server</span><span class="st" style="color: #FF9F0A">Needs Approval</span></span>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v9M12 18.5h.01"/></svg>
      </div>
'@

$mono = "font-family: ui-monospace, 'SF Mono', Menlo, 'Cascadia Code', Consolas, monospace"
$box = 'flex-grow: 1; min-height: 0; margin: 0 4px; box-sizing: border-box; padding: 12px; border-radius: 12px; background: #1C1C1E'

$screenReq = $reqHead + @"
      <span style="padding: 12px 8px 8px; font-size: 13px; line-height: 18px; letter-spacing: -0.08px; color: $grey">Wants to run a command with Bash</span>
      <div style="$box; $mono; font-size: 13px; line-height: 20px; overflow-wrap: anywhere">npm run db:migrate -- --env production</div>
      <div class="foot" style="padding: 10px 8px 0"><span>Request 1 of 1</span></div>
"@

$screenListen = $reqHead + @"
      <span style="display: flex; align-items: center; gap: 6px; padding: 12px 8px 8px; font-size: 13px; line-height: 18px; letter-spacing: -0.08px; color: #FF453A"><span aria-hidden="true" style="width: 8px; height: 8px; border-radius: 50%; background: #FF453A"></span>Listening</span>
      <div style="$box; font-size: 17px; line-height: 22px; letter-spacing: -0.43px; color: $grey">Use the staging data</div>
      <div class="foot" style="padding: 10px 8px 0"><span>Let go of the key when you finish.</span></div>
"@

$screenTranscript = $reqHead + @"
      <span style="padding: 12px 8px 8px; font-size: 13px; line-height: 18px; letter-spacing: -0.08px; color: $grey">Your Reply</span>
      <div style="$box; font-size: 17px; line-height: 22px; letter-spacing: -0.43px">Use the staging database instead.</div>
      <div class="foot" style="padding: 10px 8px 0"><span>Send denies the request and gives Claude Code this reply.</span></div>
"@

$ledOff = 'background: #3A3A3C; box-shadow: inset 0 1px 2px rgba(0,0,0,.7)'
$ledOn = 'background: #FF9F0A; box-shadow: 0 0 10px #FF9F0A, inset 0 1px 1px rgba(255,255,255,.6)'
$k1 = @{
  white = @('background: #FFFFFF; opacity: .32', 'background: #FFFFFF; box-shadow: 0 0 7px #FFFFFF')
  amber = @('background: #FF9F0A', 'background: #FF9F0A; box-shadow: 0 0 7px #FF9F0A')
  green = @('background: #30D158', 'background: #30D158; box-shadow: 0 0 7px #30D158')
}
$keys = 'k1','k2','k3','k4','deny','always','allow','red','cancel','send'

function Build($file, $title, $screen, $reqOn, $k1Color, $offKeys, $pressed) {
  $h = $head.Replace('@@TITLE@@', $title).Replace('@@SCREEN@@', $screen.TrimEnd())
  if ($reqOn) { $h = $h.Replace('@@REQLED@@', $ledOn).Replace('@@REQLABEL@@', 'A request is waiting') }
  else { $h = $h.Replace('@@REQLED@@', $ledOff).Replace('@@REQLABEL@@', 'No request') }
  $h = $h.Replace('@@K1GLOW@@', $k1[$k1Color][0]).Replace('@@K1DOT@@', $k1[$k1Color][1])
  foreach ($k in $keys) {
    $c = ''
    $w = ''
    if ($offKeys -contains $k) { $c += ' off' }
    if ($pressed -contains $k) { $c += ' down'; $w = ' ring' }
    $h = $h.Replace("@@C_$k@@", $c).Replace("@@W_$k@@", $w)
  }
  [IO.File]::WriteAllText((Join-Path $out $file), $h, (New-Object Text.UTF8Encoding($false)))
}

$answer = 'deny','always','allow'
$vox = 'cancel','send'
$sel = '#1C1C1E'

Build 'Flow1.dc.html' 'Session appears' (ListScreen 'Working' $grey $spin 'transparent' 'Working' $spin 'transparent') $false 'white' ($answer + $vox) @()
Build 'Flow2.dc.html' 'Request arrives' $screenReq $true 'amber' $vox @()
Build 'Flow3.dc.html' 'Press allow' $screenReq $true 'amber' $vox @('allow')
Build 'Flow4.dc.html' 'Hold redirect' $screenListen $true 'amber' ($answer + $vox) @('red')
Build 'Flow5.dc.html' 'Press send' $screenTranscript $true 'amber' $answer @('send')
Build 'Flow6.dc.html' 'Finished' (ListScreen 'Finished' '#30D158' $check 'transparent' 'Working' $spin 'transparent') $false 'green' ($answer + $vox) @()
Build 'Flow7.dc.html' 'Follow-up' (ListScreen 'Working' $grey $spin 'transparent' 'Working, Follow-Up Queued' $queued $sel) $false 'white' $answer @('k4','red')
'done'
