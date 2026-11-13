param([int]$TargetPid, [string]$Text, [string]$Log, [switch]$Enter, [switch]$Screen)
# Attaches to the console of another process and writes key events into its input buffer.
# No window focus is used. With -Screen, also dumps that console's visible text to the log.
$src = @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class Inj {
  [StructLayout(LayoutKind.Explicit, CharSet = CharSet.Unicode)]
  public struct INPUT_RECORD {
    [FieldOffset(0)] public ushort EventType;
    [FieldOffset(4)] public int bKeyDown;
    [FieldOffset(8)] public ushort wRepeatCount;
    [FieldOffset(10)] public ushort wVirtualKeyCode;
    [FieldOffset(12)] public ushort wVirtualScanCode;
    [FieldOffset(14)] public char UnicodeChar;
    [FieldOffset(16)] public uint dwControlKeyState;
  }
  [StructLayout(LayoutKind.Sequential)] public struct COORD { public short X; public short Y; }
  [StructLayout(LayoutKind.Sequential)] public struct SMALL_RECT { public short L; public short T; public short R; public short B; }
  [StructLayout(LayoutKind.Sequential)] public struct CSBI { public COORD Size; public COORD Cursor; public ushort Attr; public SMALL_RECT Win; public COORD Max; }
  [DllImport("kernel32.dll", SetLastError = true)] static extern bool FreeConsole();
  [DllImport("kernel32.dll", SetLastError = true)] static extern bool AttachConsole(uint pid);
  [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)] static extern IntPtr CreateFileW(string n, uint acc, uint share, IntPtr sa, uint disp, uint flags, IntPtr t);
  [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)] static extern bool WriteConsoleInputW(IntPtr h, INPUT_RECORD[] r, uint n, out uint written);
  [DllImport("kernel32.dll", SetLastError = true)] static extern bool GetConsoleMode(IntPtr h, out uint mode);
  [DllImport("kernel32.dll", SetLastError = true)] static extern bool GetConsoleScreenBufferInfo(IntPtr h, out CSBI i);
  [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)] static extern bool ReadConsoleOutputCharacterW(IntPtr h, StringBuilder sb, uint len, COORD at, out uint read);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern short VkKeyScanW(char c);
  [DllImport("user32.dll")] static extern uint MapVirtualKeyW(uint code, uint type);

  static INPUT_RECORD Key(char c, ushort vk, bool down) {
    INPUT_RECORD r = new INPUT_RECORD();
    r.EventType = 1; r.bKeyDown = down ? 1 : 0; r.wRepeatCount = 1;
    r.wVirtualKeyCode = vk; r.wVirtualScanCode = (ushort)MapVirtualKeyW(vk, 0);
    r.UnicodeChar = c; r.dwControlKeyState = 0;
    return r;
  }
  public static string Run(uint pid, string text, bool enter, bool screen) {
    StringBuilder log = new StringBuilder();
    FreeConsole();
    if (!AttachConsole(pid)) return "AttachConsole failed, error " + Marshal.GetLastWin32Error();
    IntPtr hin = CreateFileW("CONIN$", 0xC0000000, 3, IntPtr.Zero, 3, 0, IntPtr.Zero);
    if (hin == new IntPtr(-1)) { int e = Marshal.GetLastWin32Error(); FreeConsole(); return "open CONIN$ failed, error " + e; }
    uint mode; GetConsoleMode(hin, out mode);
    log.AppendLine("input mode 0x" + mode.ToString("X"));
    if (text.Length > 0 || enter) {
      var list = new System.Collections.Generic.List<INPUT_RECORD>();
      foreach (char c in text) {
        if ((int)c == 0xE000 || (int)c == 0xE001) {
          // real arrow key records (left, right), not escape sequences
          ushort avk = (ushort)((int)c == 0xE000 ? 0x25 : 0x27);
          INPUT_RECORD d = Key('\0', avk, true); d.dwControlKeyState = 0x100;
          INPUT_RECORD u = Key('\0', avk, false); u.dwControlKeyState = 0x100;
          list.Add(d); list.Add(u);
          continue;
        }
        ushort vk = (ushort)(VkKeyScanW(c) & 0xFF);
        list.Add(Key(c, vk, true)); list.Add(Key(c, vk, false));
      }
      if (enter) { list.Add(Key('\r', 0x0D, true)); list.Add(Key('\r', 0x0D, false)); }
      uint w;
      bool ok = WriteConsoleInputW(hin, list.ToArray(), (uint)list.Count, out w);
      log.AppendLine("WriteConsoleInput ok=" + ok + " wrote " + w + " of " + list.Count + " error " + (ok ? 0 : Marshal.GetLastWin32Error()));
    }
    CloseHandle(hin);
    if (screen) {
      IntPtr hout = CreateFileW("CONOUT$", 0xC0000000, 3, IntPtr.Zero, 3, 0, IntPtr.Zero);
      CSBI i;
      if (hout != new IntPtr(-1) && GetConsoleScreenBufferInfo(hout, out i)) {
        log.AppendLine("screen " + i.Size.X + "x" + i.Size.Y + " window rows " + i.Win.T + "-" + i.Win.B);
        for (short y = i.Win.T; y <= i.Win.B; y++) {
          StringBuilder sb = new StringBuilder(i.Size.X + 1);
          uint rd; COORD at; at.X = 0; at.Y = y;
          ReadConsoleOutputCharacterW(hout, sb, (uint)i.Size.X, at, out rd);
          string line = sb.ToString(0, (int)rd).TrimEnd();
          if (line.Length > 0) log.AppendLine(line);
        }
        CloseHandle(hout);
      } else log.AppendLine("screen read failed, error " + Marshal.GetLastWin32Error());
    }
    FreeConsole();
    return log.ToString();
  }
}
'@
Add-Type -TypeDefinition $src
$Text = $Text.Replace('\e', [string][char]27).Replace('{L}', [string][char]0xE000).Replace('{R}', [string][char]0xE001)
$Text = [regex]::Replace($Text, '\\x([0-9A-Fa-f]{2})', { param($m) [string][char][Convert]::ToInt32($m.Groups[1].Value, 16) })
$r = [Inj]::Run([uint32]$TargetPid, $Text, [bool]$Enter, [bool]$Screen)
[IO.File]::WriteAllText($Log, $r, (New-Object Text.UTF8Encoding($false)))
