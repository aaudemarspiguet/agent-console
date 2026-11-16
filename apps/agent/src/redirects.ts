import { posix, win32 } from 'node:path';

/**
 * Edit rules for the files a Bash command writes through output redirects (A-4).
 *
 * Claude Code checks a redirect target as if it wrote that file itself: for `> file`,
 * `>> file` and `2> file` the check uses the Edit allow rules, protected paths and the
 * working directories, and a Bash rule "allows the command, not the target"
 * (code.claude.com/docs/en/permissions, Redirections; read 2026-11-15). So Always
 * Allow on `echo x >> log.txt` must also allow editing log.txt, or the next run asks
 * again (seen on the phone 2026-11-14).
 *
 * Rules use the docs' absolute form, `//` plus the POSIX path; on Windows the drive
 * becomes the first folder ("C:\Users\alice becomes /c/Users/alice"). Targets the
 * agent cannot name exactly are left out and still ask: ones starting with `~` or
 * containing a glob character (the docs say those always need approval), and ones
 * built from variables or command output.
 */
export function redirectEditRules(command: string, cwd: string): string[] {
  const rules = new Set<string>();
  for (const target of redirectTargets(command)) {
    const rule = toRule(target, cwd);
    if (rule) rules.add(rule);
  }
  return [...rules];
}

/** The literal target of each output redirect, or null where it is not literal. */
export function redirectTargets(command: string): (string | null)[] {
  const targets: (string | null)[] = [];
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (quote) {
      if (c === '\\' && quote === '"') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '\\') {
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === '#' && (i === 0 || /\s/.test(command[i - 1]))) break; // a comment runs to the end
    if (c !== '>') continue;
    let j = i + 1;
    if (command[j] === '>' || command[j] === '|') j++; // >> append, >| clobber
    if (command[j] === '&' || command[j] === '(') {
      i = j; // >&2 duplicates a descriptor; >(cmd) is process substitution
      continue;
    }
    while (j < command.length && (command[j] === ' ' || command[j] === '\t')) j++;
    const [word, end] = readWord(command, j);
    targets.push(word);
    i = end - 1;
  }
  return targets;
}

/** Reads one shell word from `start`; the word is null if any part of it is not literal. */
function readWord(s: string, start: number): [string | null, number] {
  let out = '';
  let literal = true;
  let i = start;
  for (; i < s.length; i++) {
    const c = s[i];
    if (/[\s;|&<>()]/.test(c)) break;
    if (c === "'") {
      const close = s.indexOf("'", i + 1);
      if (close < 0) return [null, s.length];
      out += s.slice(i + 1, close);
      i = close;
    } else if (c === '"') {
      let k = i + 1;
      for (; k < s.length && s[k] !== '"'; k++) {
        // In double quotes a backslash escapes only $ ` " \ and a newline; elsewhere
        // it is kept, so "C:\Users\x" names the Windows path as written.
        if (s[k] === '\\' && k + 1 < s.length && '$`"\\\n'.includes(s[k + 1])) {
          k++;
          out += s[k];
        } else {
          if (s[k] === '$' || s[k] === '`') literal = false;
          out += s[k];
        }
      }
      if (k >= s.length) return [null, s.length];
      i = k;
    } else if (c === '\\' && i + 1 < s.length) {
      out += s[++i];
    } else {
      if (c === '$' || c === '`' || c === '*' || c === '?' || c === '[' || c === '{') literal = false;
      if (c === '~' && i === start) literal = false;
      out += c;
    }
  }
  return [literal && out ? out : null, i];
}

const NO_FILE = new Set(['/dev/null', '/dev/stdout', '/dev/stderr', 'nul']);

/** `//c/Users/x/log.txt` for a target, or null when no rule should be written. */
export function toRule(target: string | null, cwd: string): string | null {
  if (!target || NO_FILE.has(target.toLowerCase())) return null;
  if (/[*?[\]{}~]/.test(target)) return null;
  if (/^[A-Za-z]:(?![\\/])/.test(target)) return null; // C:file is relative to that drive's own folder
  let abs: string;
  if (/^[A-Za-z]:[\\/]/.test(target)) abs = win32.resolve(target);
  else if (target.startsWith('/')) abs = posix.normalize(target);
  else if (/^[A-Za-z]:[\\/]/.test(cwd)) abs = win32.resolve(cwd, target);
  else if (cwd.startsWith('/')) abs = posix.resolve(cwd, target);
  else return null; // no working directory to resolve a relative target against
  const drive = /^([A-Za-z]):[\\/]?(.*)$/.exec(abs);
  const path = drive ? `/${drive[1].toLowerCase()}/${drive[2].replace(/\\/g, '/')}` : abs;
  return `/${path.replace(/\/+$/, '')}`;
}
