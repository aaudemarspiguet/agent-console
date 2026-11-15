. (Join-Path $PSScriptRoot 'gen-flow.ps1') | Out-Null

# reuse the key grid and the key styles from the earlier boards
$baseCss = [regex]::Match($head, '(?s)<style>(.*?)</style>').Groups[1].Value.Trim()
# the key grid: 12 columns, so six number keys, the answer keys and the reply keys share three rows
function NumKey($k, $n, $glow, $dot) {
  $gl = if ($glow) { "`n" + '        <span class="glow" aria-hidden="true" style="' + $glow + '"></span>' } else { '' }
  return '      <div class="well@@W_' + $k + '@@">' + $gl + "`n" + '        <button class="key@@C_' + $k + '@@" aria-label="Session ' + $n + '"><span class="dot" style="' + $dot + '"></span><span class="num">' + $n + '</span></button>' + "`n" + '      </div>' + "`n"
}
function ReplyKey($k, $name, $legend) {
  return '      <div class="well@@W_' + $k + '@@">' + "`n" + '        <button class="key solid@@C_' + $k + '@@" aria-label="Saved reply: ' + $name + '"><span class="leg l">' + $legend + '</span></button>' + "`n" + '      </div>' + "`n"
}
$gWhite = 'background: #FFFFFF; opacity: .32'; $dWhite = 'background: #FFFFFF; box-shadow: 0 0 7px #FFFFFF'; $dIdle = 'background: #48484A'
# brief A-3: thinking is blue, an error is red
$gBlue = 'background: #64D2FF; opacity: .6'; $dBlue = 'background: #64D2FF; box-shadow: 0 0 7px #64D2FF'
$gRed = 'background: #FF453A'; $dRed = 'background: #FF453A; box-shadow: 0 0 7px #FF453A'
$wDeny = @'
      <div class="well@@W_deny@@" style="grid-column: span 2">
        <button class="key solid@@C_deny@@"><svg class="gl l" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg><span class="leg l">deny</span></button>
      </div>
'@
$wAlways = @'
      <div class="well@@W_always@@">
        <button class="key solid@@C_always@@" aria-label="Always allow for this session"><span class="leg l">always<br>allow</span></button>
      </div>
'@
$wAllow = @'
      <div class="well@@W_allow@@" style="grid-column: span 2; grid-row: span 2">
        <button class="key tint@@C_allow@@"><svg class="gl r" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span class="leg r">allow</span></button>
      </div>
'@
$wVoice = @'
      <div class="well@@W_red@@" style="grid-column: span 2">
        <button class="key solid@@C_red@@" aria-label="Redirect, hold to talk"><svg class="gl l" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg><span class="alt">hold to talk</span><span class="leg l">redirect</span></button>
      </div>
      <div class="well@@W_cancel@@">
        <button class="key solid@@C_cancel@@"><span class="leg l">cancel</span></button>
      </div>
      <div class="well@@W_send@@" style="grid-column: span 2">
        <button class="key solid@@C_send@@"><svg class="gl r" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V5M5 12l7-7 7 7"/></svg><span class="leg r">send</span></button>
      </div>
    </div>
'@
# 5 columns by 4 rows: a 3 by 2 number pad, the answer keys on the right, the voice group along the bottom
$gridTpl = '<div class="g4" style="flex-grow: 1; min-height: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); grid-template-rows: repeat(4, minmax(0, 1fr)); gap: 9px">' + "`n" +
  (NumKey 'k1' 1 '@@K1GLOW@@' '@@K1DOT@@') +
  (NumKey 'k2' 2 'background: #30D158' 'background: #30D158; box-shadow: 0 0 7px #30D158') +
  (NumKey 'k3' 3 '' $dIdle) + $wDeny + "`n" +
  (NumKey 'k4' 4 $gBlue $dBlue) +
  (NumKey 'k5' 5 $gRed $dRed) +
  (NumKey 'k6' 6 $gWhite $dWhite) + $wAllow + "`n" +
  (ReplyKey 'rep1' 'run tests' 'run<br>tests') + (ReplyKey 'rep2' 'explain' 'explain') + $wAlways + "`n" + $wVoice
$keys = $keys + 'k5','k6','rep1','rep2'

$css = $baseCss + "`n" + @'
.isl{position:absolute;z-index:4;left:14px;background:#000;overflow:hidden;box-sizing:border-box}
.isl.shut{width:37px;border-radius:18.5px;box-shadow:0 0 0 1px rgba(255,255,255,.035);display:flex;flex-direction:column;align-items:center;justify-content:space-between}
.pe{display:flex;align-items:center;justify-content:center}
.isl.open{width:320px;box-shadow:0 0 0 1px rgba(255,255,255,.07),0 18px 44px rgba(0,0,0,.6)}
.cam{position:absolute;z-index:6;left:25px;top:194px;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 38% 34%,#33405F 0,#0D111B 55%,#000 75%);box-shadow:0 0 0 2px #050506}
.tap{position:absolute;z-index:7;width:34px;height:34px;border-radius:50%;border:2px solid rgba(255,255,255,.92);background:rgba(255,255,255,.2)}
.cnum{font-size:15px;line-height:18px;font-weight:600}
.xv{box-sizing:border-box;height:100%;padding:16px 16px 14px 54px;display:flex;flex-direction:column}
.xs{box-sizing:border-box;height:100%;padding:0 18px 0 56px;display:flex;align-items:center;gap:12px}
.xh{display:flex;align-items:center;gap:10px}
.xt{flex:1 1 0;min-width:0;display:flex;flex-direction:column}
.big{font-size:17px;line-height:22px;font-weight:600;letter-spacing:-.43px}
.xsub{padding:12px 4px 8px;font-size:13px;line-height:18px;letter-spacing:-.08px;color:rgba(235,235,245,.6);display:flex;align-items:center;gap:6px}
.box{flex-grow:1;min-height:0;box-sizing:border-box;padding:12px;border-radius:12px;background:#1C1C1E}
.code{font-family:ui-monospace,'SF Mono',Menlo,'Cascadia Code',Consolas,monospace;font-size:13px;line-height:20px;overflow-wrap:anywhere}
.say{font-size:17px;line-height:23px;letter-spacing:-.43px}
.bdg{width:42px;height:42px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center}
.lay p{margin:0;padding:0 4px 9px;font-size:13px;line-height:18px;letter-spacing:-.08px}
.cap{height:36px;padding:0 16px;border-radius:18px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.14);-webkit-backdrop-filter:blur(20px) saturate(1.6);backdrop-filter:blur(20px) saturate(1.6);color:#fff;font-size:15px;line-height:20px;font-weight:500;letter-spacing:-.23px;box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}
.cap.blue{background:#0A84FF;border-color:rgba(255,255,255,.28);font-weight:600}
.bd{position:absolute;z-index:2;top:-7px;left:-7px;width:22px;height:22px;padding:0;border-radius:50%;background:#8E8E93;border:1px solid rgba(255,255,255,.3);box-shadow:0 2px 5px rgba(0,0,0,.5)}
.bd::after{content:"";position:absolute;left:5px;right:5px;top:9px;height:2px;border-radius:1px;background:#fff}
.grp{position:absolute;z-index:1;left:-5px;right:-5px;bottom:-5px;height:calc((100% - 27px) / 4 + 10px);box-sizing:border-box;border-radius:17px;border:1.5px solid rgba(255,255,255,.42);pointer-events:none}
.grp .bd{pointer-events:auto}
.slot{border-radius:13px;border:1.5px dashed rgba(255,255,255,.3)}
.sheet{position:absolute;z-index:5;left:0;right:0;top:0;bottom:0;box-sizing:border-box;padding:14px 16px;border-radius:24px;background:rgba(44,44,46,.82);-webkit-backdrop-filter:blur(30px) saturate(1.6);backdrop-filter:blur(30px) saturate(1.6);border:1px solid rgba(255,255,255,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 14px 34px rgba(0,0,0,.55);display:flex;flex-direction:column}
.chip{height:28px;padding:0 10px;border-radius:8px;background:rgba(255,255,255,.08);color:rgba(235,235,245,.7);font-size:13px;line-height:28px;letter-spacing:-.08px}
.six .row{height:44px}
.g4 .num{font-size:20px;line-height:24px}
.g4 .dot{top:8px;left:9px}
.whl{position:absolute;z-index:3;right:11px;top:100px;width:40px;display:flex;flex-direction:column;align-items:center;gap:7px}
.whl .silk{white-space:nowrap}
.wslot{position:relative;width:34px;height:168px;box-sizing:border-box;padding:4px;border-radius:17px;background:#050506;box-shadow:inset 0 2px 5px rgba(0,0,0,.9),0 1px 0 rgba(255,255,255,.07)}
.wslot.ring{outline:2px solid rgba(255,255,255,.92);outline-offset:3px}
.wcyl{width:100%;height:100%;border-radius:13px;background:linear-gradient(180deg,rgba(0,0,0,.88) 0,rgba(0,0,0,0) 24%,rgba(255,255,255,.1) 50%,rgba(0,0,0,0) 76%,rgba(0,0,0,.88) 100%),repeating-linear-gradient(180deg,#4C4C50 0 2px,#1E1E20 2px 5px);box-shadow:inset 1px 0 0 rgba(255,255,255,.12),inset -1px 0 0 rgba(0,0,0,.6)}
.ebar{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;padding:12px 2px 5px}
.ebar span{height:6px;border-radius:3px;background:rgba(255,255,255,.16)}
.ebar span.f{background:#fff}
.elab{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;padding:0 2px;font-size:11px;line-height:14px;text-align:center;color:rgba(235,235,245,.6)}
.elab .c{color:#fff;font-weight:600}
@media (prefers-reduced-transparency: reduce){.sheet{background:#2C2C2E;-webkit-backdrop-filter:none;backdrop-filter:none}.cap{background:#3A3A3C;-webkit-backdrop-filter:none;backdrop-filter:none}}
'@

$doc = @'
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
@@CSS@@
</style>
</helmet>
<div class="plate" style="position: relative; width: 874px; height: 402px; overflow: hidden; color: #FFFFFF; font-family: -apple-system, 'SF Pro Text', 'SF Pro Display', Inter, system-ui, sans-serif">
@@ISLAND@@
  <span class="cam" aria-hidden="true"></span>
@@TAP@@
@@WHEEL@@
  <div style="position: absolute; z-index: 3; top: 16px; bottom: 21px; left: @@LEFT@@px; right: 62px; display: flex; flex-direction: column; gap: 9px">
@@STRIP@@
    @@GRID@@
@@SHEET@@
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

function Strip($link, $req) {
  $l = if ($link) { 'background: #30D158; box-shadow: 0 0 8px #30D158, inset 0 1px 1px rgba(255,255,255,.6)' } else { $ledOff }
  $r = if ($req) { $ledOn } else { $ledOff }
  return @"
    <div style="height: 36px; flex: none; display: flex; align-items: center; gap: 8px">
      <span class="screw" aria-hidden="true"></span>
      <span class="silk">Link</span>
      <span class="led" role="img" aria-label="Link light" style="$l"></span>
      <div style="flex-grow: 1"></div>
      <span class="silk">Request</span>
      <span class="led" role="img" aria-label="Request light" style="$r"></span>
      <span class="screw" aria-hidden="true"></span>
    </div>
"@
}
$stripEdit = @'
    <div style="height: 36px; flex: none; display: flex; align-items: center; gap: 10px">
      <span class="screw" aria-hidden="true"></span>
      <button class="cap">Add a Key</button>
      <div style="flex-grow: 1"></div>
      <button class="cap blue">Done</button>
      <span class="screw" aria-hidden="true"></span>
    </div>
'@

function Svg($d, $sz, $color, $sw) { return '<svg aria-hidden="true" width="' + $sz + '" height="' + $sz + '" viewBox="0 0 24 24" fill="none" stroke="' + $color + '" stroke-width="' + $sw + '" stroke-linecap="round" stroke-linejoin="round"><path d="' + $d + '"/></svg>' }
$pArc = 'M12 3a9 9 0 1 0 9 9'; $pCheck = 'M5 12.5l4.5 4.5L19 7.5'; $pBang = 'M12 5v9M12 18.5h.01'; $pUp = 'M12 20V5M5 12l7-7 7 7'; $pPause = 'M9 6v12M15 6v12'; $pDots = 'M6 12h.01M12 12h.01M18 12h.01'; $pCross = 'M7 7l10 10M17 7L7 17'

# The closed pill reaches past the 125-point cutout at both ends, as iOS's Live
# Activities do round the camera: the glyph sits in the end above the camera and the
# count in the end below, where the screen can show them (chosen 2026-11-14). Sizes
# measured from Spotify's Live Activity on the iPhone 17: ends of 32.5 points (190
# in all) in every state, content centred 20.5 points from the outer end.
function Shut($top, $bottom, $tall) {
  $h = 190
  $g = 'top: ' + ((402 - $h) / 2) + 'px; height: ' + $h + 'px'
  $e = '<span class="pe" style="height: 41px">'
  return '  <div class="isl shut" style="' + $g + '">' + $e + $top + '</span>' + $e + $bottom + '</span></div>'
}
function Open($inner, $half) {
  $g = if ($half) { 'top: 116px; height: 170px; border-radius: 36px' } else { 'top: 12px; height: 378px; border-radius: 38px' }
  return '  <div class="isl open" style="' + $g + '">' + "`n" + $inner + "`n" + '  </div>'
}

$blobCC = 'd7ab54a8b06e30381ffe0e33e226ca6b'
function Head1($status, $color, $icon) {
  return @"
      <div class="xh"><span class="n">1</span><img src="/_blob/$blobCC" alt="Claude Code" style="width: 28px; height: 28px; border-radius: 7px; object-fit: contain"><span class="xt"><span class="big">api-server</span><span class="st" style="color: $color">$status</span></span>$icon</div>
"@
}
$headReq = Head1 'Needs Approval' '#FF9F0A' (Svg $pBang 18 '#FF9F0A' 2.6)
$headWork = Head1 'Running' $grey (Svg $pArc 16 '#FFFFFF' 2.4)

function IRow($n, $blob, $agent, $name, $status, $color, $icon) {
  return @"
      <div class="row"><span class="n">$n</span><img src="/_blob/$blob" alt="$agent" style="width: 26px; height: 26px; border-radius: 7px; object-fit: contain"><span class="xt"><span class="nm">$name</span><span class="st" style="color: $color">$status</span></span>$icon</div>
"@
}
$vList = '    <div class="xv six">' + "`n" + '      <span class="big" style="padding: 0 8px 6px">Agents</span>' + "`n" +
  (IRow 1 $blobCC 'Claude Code' 'api-server' 'Running' $grey (Svg $pArc 16 '#FFFFFF' 2.4)) +
  (IRow 2 'cdb4ae4ed7eaf4554a2d52b0ee82d3ba' 'Codex' 'web-app' 'Finished' '#30D158' (Svg $pCheck 16 '#30D158' 2.8)) +
  (IRow 3 '48fc1865b1f7a5ae46167a5baec1e980' 'Cursor' 'docs-site' 'Idle' $grey (Svg $pPause 16 $grey 2.4)) +
  (IRow 4 '59c30899253baf3d4871a721e8250440' 'Gemini' 'infra' 'Thinking' '#64D2FF' (Svg $pDots 16 '#64D2FF' 3)) +
  (IRow 5 $blobCC 'Claude Code' 'mobile-app' 'Error' '#FF453A' (Svg $pCross 16 '#FF453A' 2.6)) +
  (IRow 6 'cdb4ae4ed7eaf4554a2d52b0ee82d3ba' 'Codex' 'data-jobs' 'Running' $grey (Svg $pArc 16 '#FFFFFF' 2.4)) + @'
      <div style="flex-grow: 1"></div>
      <div class="foot" style="padding: 0 4px"><span>AMOGH-PC on Wi-Fi</span><span style="flex-grow: 1"></span><span role="img" aria-label="Page 1 of 2, swipe to change" style="display: flex; gap: 5px"><span class="pd" style="background: #FFFFFF"></span><span class="pd"></span></span></div>
    </div>
'@

# The screen is fixed open (chosen 2026-11-14): at rest it shows the session list,
# and a hidden request shows as its session's row needing approval.
$vListReq = $vList.Replace((IRow 1 $blobCC 'Claude Code' 'api-server' 'Running' $grey (Svg $pArc 16 '#FFFFFF' 2.4)), (IRow 1 $blobCC 'Claude Code' 'api-server' 'Needs Approval' '#FF9F0A' (Svg $pBang 18 '#FF9F0A' 2.6)))

$vReq = '    <div class="xv">' + "`n" + $headReq + @'
      <span class="xsub">Wants to run a command with Bash</span>
      <div class="box code">npm run db:migrate -- --env production</div>
      <div class="foot" style="padding: 10px 4px 0"><span>Request 1 of 1</span><span style="flex-grow: 1"></span><span>Tap to hide</span></div>
    </div>
'@
$vListen = '    <div class="xv">' + "`n" + $headReq + @'
      <span class="xsub" style="color: #FF453A"><span aria-hidden="true" style="width: 8px; height: 8px; border-radius: 50%; background: #FF453A"></span>Listening</span>
      <div class="box say" style="color: rgba(235,235,245,.6)">Use the staging data</div>
      <div class="foot" style="padding: 10px 4px 0"><span>Let go of the key when you finish.</span></div>
    </div>
'@
$vTranscript = '    <div class="xv">' + "`n" + $headReq + @'
      <span class="xsub">Your Reply</span>
      <div class="box say">Use the staging database instead.</div>
      <div class="foot" style="padding: 10px 4px 0"><span>Send denies the request and gives Claude Code this reply.</span></div>
    </div>
'@
$vSession = '    <div class="xv">' + "`n" + $headWork + @'
      <span class="xsub">Claude Code on AMOGH-PC. Recent tool calls:</span>
      <div class="box code" style="display: flex; flex-direction: column; gap: 6px; color: rgba(235,235,245,.78)"><span>Edit: src/routes/users.ts</span><span>Bash: npm test</span><span>Write: migrations/004_users.sql</span></div>
      <div class="foot" style="padding: 10px 4px 0"><span>Hold redirect to queue a follow-up.</span></div>
    </div>
'@
function Result($bg, $color, $path, $title, $sub) {
  return '    <div class="xs"><span class="bdg" style="background: ' + $bg + '">' + (Svg $path 20 $color 2.6) + '</span><span class="xt"><span class="big">' + $title + '</span><span class="st">' + $sub + '</span></span></div>'
}
$vLayout = @"
    <div class="xv lay">
      <span class="big" style="padding: 0 4px 10px">Layout</span>
      <p>Drag a key to move it. Drop it on another key the same size to swap them.</p>
      <p>Tap a minus to take a key off the deck.</p>
      <p>Redirect, Cancel and Send are one group. Saved replies need that group.</p>
      <p style="color: $grey">Allow and Deny cannot be removed.</p>
      <div style="flex-grow: 1"></div>
      <div class="foot" style="padding: 0 4px"><span>Press Done when you finish.</span></div>
    </div>
"@
$vPair = @"
    <div class="xv lay">
      <span class="big" style="padding: 0 4px 10px">Pair With Your PC</span>
      <p>Open Deck on your PC and choose Pair a Phone.</p>
      <p>Point this phone at the code on the PC's screen.</p>
      <p style="color: $grey">Both must be on the same Wi-Fi network. You do this once.</p>
      <div style="flex-grow: 1"></div>
      <div class="foot" style="padding: 0 4px"><span>Looking for a code</span></div>
    </div>
"@

$spinW = Svg $pArc 16 '#FFFFFF' 2.6
$alertDot = '<span style="width: 10px; height: 10px; border-radius: 50%; background: #FF9F0A; box-shadow: 0 0 10px #FF9F0A"></span>'

$vEffort = '    <div class="xv" style="padding-top: 14px; padding-bottom: 12px">' + "`n" + $headWork + @'
      <div class="ebar" role="img" aria-label="Effort: high now, xhigh chosen"><span class="f"></span><span class="f"></span><span class="f"></span><span class="f"></span><span></span></div>
      <div class="elab" aria-hidden="true"><span>low</span><span>medium</span><span>high</span><span class="c">xhigh</span><span>max</span></div>
      <div style="flex-grow: 1"></div>
      <div class="foot" style="padding: 0 4px"><span>Effort was high. Keep turning or stop.</span></div>
    </div>
'@

function Wheel($state, $edit) {
  $led = if ($state -eq 'on' -or $state -eq 'turn') { 'background: #FFFFFF; box-shadow: 0 0 8px rgba(255,255,255,.8), inset 0 1px 1px rgba(255,255,255,.6)' } else { $ledOff }
  $ring = if ($state -eq 'turn') { ' ring' } else { '' }
  $bd = if ($edit) { '<button class="bd" aria-label="Remove the effort wheel"></button>' } else { '' }
  return @"
  <div class="whl">
    <span class="led" role="img" aria-label="Effort wheel light" style="$led"></span>
    <div class="wslot$ring" role="slider" aria-label="Effort wheel" aria-orientation="vertical" aria-valuemin="1" aria-valuemax="5" aria-valuenow="3" tabindex="0">$bd<div class="wcyl"></div></div>
    <span class="silk">Effort</span>
  </div>
"@
}

function BuildI($file, $title, $island, $open, $reqOn, $k1Color, $offKeys, $pressed, $tap, $mode, $wheel) {
  $g = $gridTpl
  $wh = Wheel $wheel ($mode -eq 'layout' -or $mode -eq 'sheet')
  $strip = Strip $true $reqOn
  $sheet = ''
  if ($mode -eq 'layout' -or $mode -eq 'sheet') {
    $strip = $stripEdit.TrimEnd()
    $g = [regex]::Replace($g, '(?s)<div class="well@@W_always@@"[^>]*>.*?</div>', '<div class="slot" role="img" aria-label="Empty space"></div>')
    foreach ($k in 'k1','k2','k3','k4','k5','k6') { $g = $g.Replace('<button class="key@@C_' + $k + '@@"', '<button class="bd" aria-label="Remove key"></button><button class="key@@C_' + $k + '@@"') }
    foreach ($k in 'rep1','rep2') { $g = $g.Replace('<button class="key solid@@C_' + $k + '@@"', '<button class="bd" aria-label="Remove saved reply"></button><button class="key solid@@C_' + $k + '@@"') }
    $open1 = $g.Substring(0, $g.IndexOf('>') + 1)
    $g = $g.Replace($open1, $open1.Replace('style="', 'style="position: relative; ') + "`n" + '      <div class="grp" role="group" aria-label="Voice keys: redirect, cancel and send"><button class="bd" aria-label="Remove the voice keys"></button></div>')
  }
  if ($mode -eq 'sheet') {
    $sheet = @"
    <div class="sheet">
      <div style="display: flex; align-items: center; height: 36px"><span class="big" style="flex-grow: 1">Add a Key</span><button class="cap" style="height: 32px; padding: 0 14px">Close</button></div>
      <span style="padding: 12px 0 6px; font-size: 13px; line-height: 18px; color: $grey">Not on the Deck</span>
      <div style="display: flex; align-items: center; gap: 12px; height: 56px; padding: 0 12px; border-radius: 14px; background: rgba(255,255,255,.08)">
        <span class="xt"><span class="nm">Always Allow</span><span class="st">Allows this kind of request for the rest of the session</span></span>
        <button class="cap blue" style="height: 32px; padding: 0 16px">Add</button>
      </div>
      <span style="padding: 16px 0 8px; font-size: 13px; line-height: 18px; color: $grey">On the Deck</span>
      <div style="display: flex; flex-wrap: wrap; gap: 6px"><span class="chip">1</span><span class="chip">2</span><span class="chip">3</span><span class="chip">4</span><span class="chip">5</span><span class="chip">6</span><span class="chip">Deny</span><span class="chip">Allow</span><span class="chip">Voice: Redirect, Cancel, Send</span><span class="chip">Reply: run tests</span><span class="chip">Reply: explain</span><span class="chip">Effort Wheel</span></div>
      <div style="flex-grow: 1"></div>
      <span class="st">A key does one action. Its legend is fixed. Saved replies are written on the PC.</span>
    </div>
"@
  }
  if ($mode -eq 'pair') {
    $strip = Strip $false $false
    $g = @'
<div style="flex-grow: 1; min-height: 0; box-sizing: border-box; padding: 8px; border-radius: 24px; display: flex" class="bezel">
      <div role="img" aria-label="Camera view" style="position: relative; flex-grow: 1; border-radius: 16px; background: linear-gradient(160deg, #1B1D22, #0B0C0E); border: 1px solid rgba(255,255,255,.06)">
        <span style="position: absolute; left: 50%; top: 50%; width: 150px; height: 150px; margin: -75px 0 0 -75px; border-radius: 18px; border: 2px solid rgba(255,255,255,.85)"></span>
      </div>
    </div>
'@
  }
  $h = $doc.Replace('@@TITLE@@', $title).Replace('@@CSS@@', $css).Replace('@@ISLAND@@', $island).Replace('@@TAP@@', $tap).Replace('@@WHEEL@@', $wh.TrimEnd()).Replace('@@STRIP@@', $strip.TrimEnd()).Replace('@@GRID@@', $g.Trim()).Replace('@@SHEET@@', $sheet.TrimEnd())
  $h = $h.Replace('@@LEFT@@', $(if ($open) { '348' } else { '62' }))
  $h = $h.Replace('@@K1GLOW@@', $k1[$k1Color][0]).Replace('@@K1DOT@@', $k1[$k1Color][1])
  foreach ($k in $keys) {
    $c = ''; $w = ''
    if ($offKeys -contains $k) { $c += ' off' }
    if ($pressed -contains $k) { $c += ' down'; $w = ' ring' }
    $h = $h.Replace("@@C_$k@@", $c).Replace("@@W_$k@@", $w)
  }
  [IO.File]::WriteAllText((Join-Path $out $file), $h, (New-Object Text.UTF8Encoding($false)))
}

$none = @()
$count4 = '<span class="cnum">6</span>'
$vReply = '    <div class="xv">' + "`n" + $headWork + @'
      <span class="xsub">Saved Reply</span>
      <div class="box say">Run the tests and fix any failures.</div>
      <div class="foot" style="padding: 10px 4px 0"><span>Send queues this for the end of the turn.</span></div>
    </div>
'@
BuildI 'Reply1.dc.html' 'Press a saved reply' (Open $vReply $false) $true $false 'white' $answer @('rep1') '' '' 'on'
BuildI 'Reply2.dc.html' 'Saved reply queued' (Open (Result 'rgba(48,209,88,.18)' '#30D158' $pCheck 'Follow-up queued' 'api-server gets it when its turn ends') $true) $true $false 'white' ($answer + $vox) @('send') '' '' 'on'
BuildI 'Island1.dc.html' 'At rest' (Open $vList $false) $true $false 'white' ($answer + $vox) $none '' ''
BuildI 'Island2.dc.html' 'Session list' (Open $vList $false) $true $false 'white' ($answer + $vox) $none '' ''
BuildI 'Island3.dc.html' 'Request arrives' (Open $vReq $false) $true $true 'amber' $vox $none '' ''
BuildI 'Island4.dc.html' 'Allowed' (Open (Result 'rgba(48,209,88,.18)' '#30D158' $pCheck 'Allowed' 'api-server is running it now') $true) $true $false 'white' ($answer + $vox) @('allow') '' ''
BuildI 'Island5.dc.html' 'Hold redirect' (Open $vListen $false) $true $true 'amber' ($answer + $vox) @('red') '' ''
BuildI 'Island6.dc.html' 'Press send' (Open $vTranscript $false) $true $true 'amber' $answer @('send') '' ''
BuildI 'Island7.dc.html' 'Agent finishes' (Open (Result 'rgba(48,209,88,.18)' '#30D158' $pCheck 'api-server finished' 'Its turn has ended.') $true) $true $false 'green' ($answer + $vox) $none '' ''
BuildI 'Island8.dc.html' 'Session view' (Open $vSession $false) $true $false 'white' ($answer + $vox) @('k1') '' '' 'on'
BuildI 'Effort1.dc.html' 'Turn the wheel' (Open $vEffort $true) $true $false 'white' ($answer + $vox) $none '' '' 'turn'
BuildI 'Effort2.dc.html' 'Effort set' (Open (Result 'rgba(48,209,88,.18)' '#30D158' $pCheck 'Effort: xhigh' 'api-server, from its next message') $true) $true $false 'white' ($answer + $vox) $none '' '' 'on'
BuildI 'Effort3.dc.html' 'Effort not changed' (Open (Result 'rgba(255,159,10,.18)' '#FF9F0A' $pBang 'Not changed' 'api-server is still on high') $true) $true $false 'white' ($answer + $vox) $none '' '' 'on'
BuildI 'Island9.dc.html' 'Hidden request' (Open $vListReq $false) $true $true 'amber' ($answer + $vox) $none '' ''
BuildI 'IslandLayout1.dc.html' 'Layout mode' (Open $vLayout $false) $true $false 'white' $none $none '' 'layout'
BuildI 'IslandLayout2.dc.html' 'Add a key' (Open $vLayout $false) $true $false 'white' $none $none '' 'sheet'
BuildI 'IslandPair.dc.html' 'Pairing' (Open $vPair $false) $true $false 'white' $none $none '' 'pair'

$chk = [IO.File]::ReadAllText((Join-Path $out 'IslandLayout1.dc.html'))
'grid chars: ' + $gridTpl.Length + '; css chars: ' + $baseCss.Length + '; left tokens: ' + ([regex]::Matches(([IO.File]::ReadAllText((Join-Path $out 'Island3.dc.html'))) + $chk + ([IO.File]::ReadAllText((Join-Path $out 'IslandPair.dc.html'))), '@@')).Count + '; badges: ' + ([regex]::Matches($chk, 'class="bd"')).Count + '; slot: ' + $chk.Contains('class="slot"')
# gen-flow.ps1 also writes the older Flow boards, which are not part of the canvas
Remove-Item (Join-Path $out 'Flow*.dc.html') -ErrorAction SilentlyContinue
