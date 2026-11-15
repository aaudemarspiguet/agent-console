import { useSyncExternalStore } from 'react';
import type { AgentMessage, KeyId, Pairing, PermissionRequest, PhoneMessage, SavedReplies, SessionInfo } from '@deck/protocol';
import type { PlateLights, SessionLight } from '../lights';
import type { LinkState } from '../link/client';
import { SOURCE } from './source';
import {
  AGENT_NAMES,
  type AgentId,
  demoSessions,
  EFFORT_FAILS_ON,
  EFFORT_LEVELS,
  FOLLOW_UP,
  NEW_SESSION,
  PC_NAME,
  REQUESTS,
  type Request,
  SAVED_REPLIES,
  type Session,
} from './demo';

/**
 * What the island shows and how it reacts to touches and keys (handoff T13).
 * The behaviour is ported from the clickable prototype ("Island Deck") and
 * checked against the brief; the text and the states are the mockups'. Since
 * T15 it is fed by the PC link (`onAgent`, and `out` for what the keys send);
 * `SOURCE` in `source.ts` switches back to the demo sessions in `demo.ts`.
 */

export type View = 'pair' | 'list' | 'request' | 'session' | 'listening' | 'transcript' | 'effort' | 'result';
export type Tone = 'green' | 'red' | 'blue' | 'amber' | 'neutral';
export type BadgeGlyph = 'check' | 'checks' | 'cross' | 'up' | 'undo' | 'bang' | 'plus' | 'mic' | 'pause';

/** A half-height card: a result, an event or a hint. */
export interface Card {
  tone: Tone;
  glyph: BadgeGlyph;
  title: string;
  sub: string;
  /** Show this agent's icon instead of a badge ("<project> started"). */
  agent?: AgentId;
}

/** Who a spoken or saved reply goes to: with a denial (V-3), or queued (V-4). */
export type ReplyTarget = { kind: 'reply'; requestId: number; session: number } | { kind: 'follow'; session: number };

export interface IslandState {
  sessions: Record<number, Session | null>;
  /** Waiting requests, oldest first (A-4). */
  queue: Request[];
  open: boolean;
  view: View | null;
  card: Card | null;
  selected: number | null;
  talk: { target: ReplyTarget; words: string[]; heard: number; startedAt: number } | null;
  transcript: { target: ReplyTarget; text: string; saved: boolean } | null;
  /** The answer keys work: a short moment has passed since the request showed (A-5). */
  armed: boolean;
  page: number;
  effort: { session: number; from: number; to: number } | null;
  /** Counts presses of keys that do nothing, so the island can shake. */
  nudges: number;
  /** The link to the PC (C-4). The demo is always linked. */
  link: LinkState;
  pcName: string;
  /** The saved replies, written on the PC (R-1). */
  replies: SavedReplies;
}

/** Time before the answer keys light, after a request shows (A-5; the user chose 0.6 s on 2026-11-14). */
export const ANSWER_DELAY_MS = 600;
/** Rows on a page of the session list: one per number key (A-2, K-10). */
export const KEYS_PER_PAGE = 6;
/** The quiet moment after the wheel stops before the change is sent (E-3). Not decided in the brief. */
const EFFORT_SEND_MS = 900;

const isWorking = (s: Session | null | undefined) => !!s && (s.state === 'running' || s.state === 'thinking');
const LIVE = SOURCE === 'live';

/** The island's words for a request's tool (board 3: "Wants to run a command with Bash"). */
function verbFor(tool: string): string {
  switch (tool) {
    case 'Bash':
    case 'PowerShell':
      return `Wants to run a command with ${tool}`;
    case 'Edit':
    case 'MultiEdit':
    case 'NotebookEdit':
      return 'Wants to edit a file';
    case 'Write':
      return 'Wants to write a file';
    case 'Read':
      return 'Wants to read a file';
    case 'WebFetch':
      return 'Wants to fetch a web page';
    case 'WebSearch':
      return 'Wants to search the web';
    default:
      return tool.startsWith('mcp__') ? `Wants to use ${tool.split('__').slice(1).join(' ')}` : `Wants to use ${tool}`;
  }
}

const folderName = (cwd: string) => cwd.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || cwd || '?';

class IslandStore {
  s: IslandState = {
    sessions: LIVE ? {} : demoSessions(),
    queue: [],
    // The screen is always open (the user, 2026-11-14): it never collapses to a
    // pill, and rests on the session list.
    open: true,
    view: 'list',
    card: null,
    selected: null,
    talk: null,
    transcript: null,
    armed: false,
    page: 0,
    effort: null,
    nudges: 0,
    link: LIVE ? 'unpaired' : 'linked',
    pcName: LIVE ? '' : PC_NAME,
    replies: SAVED_REPLIES,
  };

  /** Sends to the PC; false when the link is down. Set by `link/live.ts`. */
  out: (message: PhoneMessage) => boolean = () => false;
  /** A pairing was scanned. Set by `link/live.ts`. */
  onPaired: (pairing: Pairing) => void = () => {};

  private version = 0;
  private listeners = new Set<() => void>();
  private autoTimer?: ReturnType<typeof setTimeout>;
  private armTimer?: ReturnType<typeof setTimeout>;
  private talkTimer?: ReturnType<typeof setInterval>;
  private effortTimer?: ReturnType<typeof setTimeout>;
  private nextRequest = 0;
  private requestIds = 0;
  private demoStep = 0;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getVersion = () => this.version;
  private emit() {
    this.s = { ...this.s };
    this.version += 1;
    this.listeners.forEach((l) => l());
  }

  // ---------- helpers ----------

  pendingFor(n: number) {
    return this.s.queue.some((r) => r.session === n);
  }

  private show(view: View, opts: { auto?: number; after?: () => void } = {}) {
    const s = this.s;
    const changed = !s.open || s.view !== view;
    s.view = view;
    s.open = true;
    clearTimeout(this.autoTimer);
    this.autoTimer = undefined;
    if (view === 'request' && changed) {
      s.armed = false;
      clearTimeout(this.armTimer);
      this.armTimer = setTimeout(() => {
        this.s.armed = true;
        this.emit();
      }, ANSWER_DELAY_MS);
    }
    if (opts.auto) {
      this.autoTimer = setTimeout(() => {
        this.autoTimer = undefined;
        (opts.after ?? (() => this.next()))();
      }, opts.auto);
    }
    this.emit();
  }

  /**
   * Back to the resting view, the session list. This is what closing the
   * island used to do; the screen now stays open (the user, 2026-11-14).
   */
  private collapse() {
    const s = this.s;
    s.view = 'list';
    clearTimeout(this.autoTimer);
    this.autoTimer = undefined;
    this.emit();
  }

  private flash(card: Card, ms: number, after?: () => void) {
    this.s.card = card;
    this.show('result', { auto: ms, after });
  }

  /** What follows a result: a waiting transcript, then the next request, then the list. */
  private next() {
    if (this.s.transcript) return this.show('transcript');
    if (this.s.queue.length) return this.show('request');
    this.collapse();
  }

  /** Whether an event may take over the island ("started", "finished"). */
  private canInterrupt() {
    const s = this.s;
    return !s.talk && !s.transcript && !(s.open && s.view !== null && ['request', 'listening', 'transcript', 'effort'].includes(s.view));
  }

  private nudge() {
    this.s.nudges += 1;
    this.emit();
  }

  private name(n: number) {
    return this.s.sessions[n]?.project ?? `Session ${n}`;
  }

  /** Sends to the PC in live mode; in the demo there is nothing to send to. */
  private send(message: PhoneMessage): boolean {
    return !LIVE || this.out(message);
  }

  private notLinked() {
    this.flash({ tone: 'amber', glyph: 'bang', title: 'Not linked', sub: `Nothing was sent. Looking for ${this.s.pcName || 'your PC'}.` }, 2200);
  }

  /** The list's foot: where the PC is (C-4). */
  pcLabel() {
    const s = this.s;
    if (s.link === 'linked') return `${s.pcName} on Wi-Fi`;
    if (s.link === 'unpaired') return 'Not paired';
    return `Looking for ${s.pcName || 'your PC'}`;
  }

  // ---------- touches on the island and plate (K-5) ----------

  /**
   * A tap on the screen: a result moves on, a request is hidden (A-4: it stays
   * in the queue, and the list shows its session needing approval), a session
   * view goes back to the list. Nothing happens on the list itself, or while
   * listening or showing a transcript.
   */
  tapIsland = () => {
    const s = this.s;
    if (s.view === 'pair') return;
    if (s.talk || s.view === 'listening' || s.view === 'transcript' || s.view === 'list') return;
    if (s.view === 'result') return this.next();
    this.collapse();
  };

  tapRow = (n: number) => {
    if (!this.s.sessions[n]) return;
    this.pressNumber(n);
  };

  tapOutside = () => {
    const s = this.s;
    if (s.view === 'session') this.collapse();
  };

  pages() {
    const top = Math.max(KEYS_PER_PAGE, ...Object.keys(this.s.sessions).map(Number).filter((n) => this.s.sessions[n]));
    return Math.ceil(top / KEYS_PER_PAGE);
  }

  swipe = (direction: 1 | -1) => {
    const s = this.s;
    if (s.view !== 'list') return;
    const page = Math.min(this.pages() - 1, Math.max(0, s.page + direction));
    if (page === s.page) return;
    s.page = page;
    this.emit();
  };

  // ---------- keys ----------

  pressKey = (id: KeyId) => {
    const number = /^session(\d)$/.exec(id);
    if (number) return this.pressNumber(Number(number[1]));
    switch (id) {
      case 'allow':
      case 'alwaysAllow':
      case 'deny':
        return this.answer(id);
      case 'send':
        return this.s.transcript ? this.sendTranscript() : this.nudge();
      case 'cancel':
        if (this.s.transcript) return this.cancelTranscript();
        if (this.cancelFollowUpAvailable()) return this.cancelFollowUp();
        return this.nudge();
      case 'reply1':
      case 'reply2':
        return this.savedReply(id);
      default:
        return undefined;
    }
  };

  private pressNumber(n: number) {
    const s = this.s;
    const session = s.sessions[n];
    if (!session) {
      s.selected = null;
      return this.flash(
        { tone: 'neutral', glyph: 'plus', title: `Key ${n} is free`, sub: 'Start an agent on your PC and it lands here.' },
        2200,
      );
    }
    if (s.selected === n && s.open && (s.view === 'session' || s.view === 'request')) {
      s.selected = null;
      return this.collapse();
    }
    if (s.view === 'pair') return this.nudge();
    s.selected = n;
    if (s.talk || s.transcript) return this.emit();
    const index = s.queue.findIndex((r) => r.session === n);
    if (index > 0) s.queue.unshift(s.queue.splice(index, 1)[0]);
    // Opening a finished session is seeing it: it becomes idle (A-3).
    if (index < 0 && session.state === 'finished') {
      session.state = 'idle';
      if (session.id) this.send({ t: 'seen', sessionId: session.id });
    }
    this.show(index >= 0 ? 'request' : 'session');
  }

  /** The request is on screen and can be answered. */
  requestShowing() {
    const s = this.s;
    return s.queue.length > 0 && s.open && s.view === 'request' && !s.talk && !s.transcript;
  }

  private answer(kind: 'allow' | 'alwaysAllow' | 'deny') {
    const s = this.s;
    if (!s.queue.length || s.talk || s.transcript) return this.nudge();
    // The first press while the request is hidden shows it again (A-4).
    if (!(s.open && s.view === 'request')) return this.show('request');
    // A press before the keys light is ignored (A-5).
    if (!s.armed) return;
    this.resolve(kind);
  }

  /**
   * Allow or Deny pressed in the real Dynamic Island's expanded view (K-12),
   * while Deck is in the background: the person has read the request there.
   */
  answerFromLiveActivity = (kind: 'allow' | 'deny', requestId: number) => {
    const s = this.s;
    // Only the request the island drew the buttons for, and only if it is still
    // the oldest: a stale press must never answer a different request.
    if (s.queue[0]?.id !== requestId) return;
    this.resolve(kind);
  };

  private resolve(kind: 'allow' | 'alwaysAllow' | 'deny') {
    const s = this.s;
    const head = s.queue[0];
    if (head.remoteId) {
      const sent = this.send(
        kind === 'deny'
          ? { t: 'answer', id: head.remoteId, decision: 'deny' }
          : { t: 'answer', id: head.remoteId, decision: 'allow', always: kind === 'alwaysAllow' },
      );
      if (!sent) return this.notLinked();
    }
    const req = s.queue.shift()!;
    // A reply being spoken or waiting to be sent for this request has nothing to
    // go with any more (it could be answered from the real island meanwhile).
    if (s.talk?.target.kind === 'reply' && s.talk.target.requestId === req.id) {
      clearInterval(this.talkTimer);
      s.talk = null;
    }
    if (s.transcript?.target.kind === 'reply' && s.transcript.target.requestId === req.id) s.transcript = null;
    const session = s.sessions[req.session];
    const first = req.body.split('\n')[0];
    if (session) {
      session.state = 'running';
      session.log.push(kind === 'deny' ? `Denied ${req.tool}: ${first}` : `${req.tool}: ${first}`);
    }
    const name = this.name(req.session);
    s.card =
      kind === 'allow'
        ? { tone: 'green', glyph: 'check', title: 'Allowed', sub: `${name} is running it now` }
        : kind === 'alwaysAllow'
          ? { tone: 'green', glyph: 'checks', title: 'Always allowed', sub: `${req.tool} for ${name}, this session` }
          : { tone: 'red', glyph: 'cross', title: 'Denied', sub: `${name} will try another way` };
    if (s.selected === req.session) s.selected = null;
    this.show('result', { auto: 1500 });
  }

  /** Who a reply would go to now, or a hint saying why there is no one. */
  private replyTarget(): ReplyTarget | Card {
    const s = this.s;
    if (s.transcript) return s.transcript.target;
    const req = s.queue[0];
    if (req && ((s.open && s.view === 'request') || s.selected === null || s.selected === req.session)) {
      return { kind: 'reply', requestId: req.id, session: req.session };
    }
    if (s.selected !== null && s.sessions[s.selected]) {
      if (!isWorking(s.sessions[s.selected])) {
        return {
          tone: 'neutral',
          glyph: 'mic',
          title: `${this.name(s.selected)} is not working`,
          sub: 'A follow-up needs a working session. Type the prompt on your PC.',
        };
      }
      return { kind: 'follow', session: s.selected };
    }
    return { tone: 'neutral', glyph: 'mic', title: 'Pick a session first', sub: 'Press a number, then hold redirect to queue a follow-up.' };
  }

  redirectDown = () => {
    const s = this.s;
    if (s.talk) return;
    const target = this.replyTarget();
    if (!('kind' in target)) return this.flash(target, target.title === 'Pick a session first' ? 2500 : 3000);
    if (LIVE) {
      // Speech recognition is T16; until then a held Redirect only says so.
      return this.flash({ tone: 'neutral', glyph: 'mic', title: 'Voice comes next', sub: 'Use a saved reply for now.' }, 2200);
    }
    const req = target.kind === 'reply' ? s.queue.find((r) => r.id === target.requestId) : undefined;
    const phrase = req?.reply ?? FOLLOW_UP;
    s.transcript = null;
    s.talk = { target, words: phrase.split(' '), heard: 0, startedAt: Date.now() };
    clearInterval(this.talkTimer);
    // The demo "hears" a word every 190 ms, as the prototype does. Real speech
    // recognition (V-1) is not wired here.
    this.talkTimer = setInterval(() => {
      const talk = this.s.talk;
      if (talk && talk.heard < talk.words.length) {
        talk.heard += 1;
        this.emit();
      }
    }, 190);
    this.show('listening');
  };

  redirectUp = () => {
    const s = this.s;
    const talk = s.talk;
    if (!talk) return;
    clearInterval(this.talkTimer);
    s.talk = null;
    if (Date.now() - talk.startedAt < 450) {
      return this.flash({ tone: 'neutral', glyph: 'mic', title: 'Hold to talk', sub: 'Keep holding redirect while you speak.' }, 1900);
    }
    s.transcript = { target: talk.target, text: talk.words.join(' '), saved: false };
    this.show('transcript');
  };

  /** A saved reply is shown like a transcript and delivered like one (R-2, R-3). */
  private savedReply(id: 'reply1' | 'reply2') {
    const s = this.s;
    if (s.talk) return;
    const target = this.replyTarget();
    if (!('kind' in target)) return this.flash(target, target.title === 'Pick a session first' ? 2500 : 3000);
    s.transcript = { target, text: s.replies[id], saved: true };
    this.show('transcript');
  }

  private sendTranscript() {
    const s = this.s;
    const tr = s.transcript;
    if (!tr) return;
    const n = tr.target.session;
    const session = s.sessions[n];
    const name = this.name(n);
    if (LIVE) {
      const target = tr.target;
      const req = target.kind === 'reply' ? s.queue.find((r) => r.id === target.requestId) : undefined;
      if (target.kind === 'reply' && !req?.remoteId) {
        s.transcript = null;
        return this.flash({ tone: 'neutral', glyph: 'undo', title: 'Not sent', sub: 'That request is no longer waiting.' }, 2000);
      }
      if (target.kind === 'follow' && !isWorking(session)) {
        // Falls through to "Not sent" below; nothing goes to the PC.
      } else {
        const sent =
          req?.remoteId
            ? this.send({ t: 'answer', id: req.remoteId, decision: 'deny', message: tr.text })
            : this.send({ t: 'followup', sessionId: session!.id!, text: tr.text });
        if (!sent) return this.notLinked();
      }
    }
    s.transcript = null;
    if (tr.target.kind === 'reply') {
      const requestId = tr.target.requestId;
      s.queue = s.queue.filter((r) => r.id !== requestId);
      if (session) {
        session.state = 'running';
        session.log.push('Your reply was delivered with the denial');
      }
      s.card = { tone: 'blue', glyph: 'up', title: 'Reply sent', sub: `Denied, and ${name} has your reply` };
    } else if (isWorking(session)) {
      session!.queued = tr.text;
      s.card = { tone: 'green', glyph: 'check', title: 'Follow-up queued', sub: `${name} gets it when its turn ends` };
    } else {
      s.card = { tone: 'neutral', glyph: 'mic', title: 'Not sent', sub: `${name} stopped working. Type the prompt on your PC.` };
    }
    // The session stays selected after a follow-up (board Reply 2 keeps the wheel lit).
    if (tr.target.kind === 'reply') s.selected = null;
    this.show('result', { auto: 1700 });
  }

  private cancelTranscript() {
    const tr = this.s.transcript;
    if (!tr) return;
    this.s.transcript = null;
    this.flash(
      {
        tone: 'neutral',
        glyph: 'undo',
        title: 'Thrown away',
        sub: tr.target.kind === 'reply' ? 'The request is still waiting for you.' : 'Nothing was sent.',
      },
      1300,
    );
  }

  /** A queued follow-up can be cancelled from its session's view (V-4). */
  cancelFollowUpAvailable() {
    const s = this.s;
    return s.open && s.view === 'session' && s.selected !== null && !!s.sessions[s.selected]?.queued;
  }

  private cancelFollowUp() {
    const n = this.s.selected!;
    const session = this.s.sessions[n]!;
    if (session.id && !this.send({ t: 'cancelFollowup', sessionId: session.id })) return this.notLinked();
    session.queued = undefined;
    this.flash({ tone: 'neutral', glyph: 'undo', title: 'Follow-up cancelled', sub: `${this.name(n)} will not get it.` }, 1300, () =>
      this.show('session'),
    );
  }

  // ---------- the effort wheel (E-1 to E-7) ----------

  /**
   * The wheel acts on the selected session (E-6), so its light is on. As on the
   * boards, that holds whatever the island shows (session view, effort, a
   * result, a saved reply), but not while a reply is being spoken.
   */
  wheelActive() {
    const s = this.s;
    const n = s.selected;
    // Changing effort from the deck is T17; until then the wheel stays unlit on live sessions (E-6).
    if (n === null || s.talk || LIVE) return false;
    const session = s.sessions[n];
    // Only Claude Code's console route is tested (E-6).
    return !!session && session.agent === 'claudeCode' && !this.pendingFor(n);
  }

  /** The level the wheel sits at: the one being chosen, or the session's own. */
  wheelLevel() {
    const s = this.s;
    if (s.effort) return s.effort.to;
    const session = s.selected !== null ? s.sessions[s.selected] : null;
    return session?.effort ?? 2;
  }

  wheelTurn = (level: number) => {
    const s = this.s;
    if (!this.wheelActive()) return;
    clearTimeout(this.effortTimer);
    const n = s.selected!;
    if (!s.effort) s.effort = { session: n, from: s.sessions[n]!.effort, to: level };
    s.effort.to = level;
    if (s.view !== 'effort') this.show('effort');
    else this.emit();
  };

  wheelStop = (level: number) => {
    const s = this.s;
    if (!s.effort) return;
    s.effort.to = level;
    clearTimeout(this.effortTimer);
    this.effortTimer = setTimeout(() => this.commitEffort(), EFFORT_SEND_MS);
    this.emit();
  };

  private commitEffort() {
    const s = this.s;
    const e = s.effort;
    if (!e) return;
    s.effort = null;
    const session = s.sessions[e.session];
    if (!session) return this.collapse();
    const name = session.project;
    if (e.to === e.from) return this.show('session');
    if (e.session === EFFORT_FAILS_ON) {
      s.card = { tone: 'amber', glyph: 'bang', title: 'Not changed', sub: `${name} is still on ${EFFORT_LEVELS[e.from]}` };
    } else {
      session.effort = e.to;
      s.card = { tone: 'green', glyph: 'check', title: `Effort: ${EFFORT_LEVELS[e.to]}`, sub: `${name}, from its next message` };
    }
    // The island closes about two seconds after the result (E-2).
    this.show('result', { auto: 2000 });
  }

  // ---------- demo events (temporary) ----------

  /** The next demo event: a request, a session finishing, a session starting. */
  demoNext = () => {
    if (LIVE) return;
    const step = this.demoStep % 3;
    this.demoStep += 1;
    if (step === 0) this.demoRequest();
    else if (step === 1) this.demoFinish();
    else this.demoStart();
  };

  private demoRequest() {
    const s = this.s;
    for (let i = 0; i < REQUESTS.length; i += 1) {
      const t = REQUESTS[this.nextRequest % REQUESTS.length];
      this.nextRequest += 1;
      if (!s.sessions[t.session] || this.pendingFor(t.session)) continue;
      s.queue.push({ ...t, id: (this.requestIds += 1) });
      // A new request while busy only joins the queue.
      if (s.talk || s.transcript || (s.open && s.view === 'request')) return this.emit();
      return this.show('request');
    }
  }

  private demoFinish() {
    const s = this.s;
    const n = Object.keys(s.sessions)
      .map(Number)
      .find((k) => isWorking(s.sessions[k]) && !this.pendingFor(k));
    if (n === undefined) return;
    const session = s.sessions[n]!;
    let card: Card;
    if (session.queued) {
      session.log.push('Your follow-up was delivered');
      session.queued = undefined;
      card = { tone: 'blue', glyph: 'up', title: `${session.project} finished a turn`, sub: 'It has your follow-up now.' };
    } else {
      session.state = 'finished';
      card = { tone: 'green', glyph: 'check', title: `${session.project} finished`, sub: 'Its turn has ended.' };
    }
    if (this.canInterrupt()) this.flash(card, 2500);
    else this.emit();
  }

  private demoStart() {
    const s = this.s;
    let n = 1;
    while (s.sessions[n]) n += 1;
    s.sessions[n] = { ...NEW_SESSION, log: [...NEW_SESSION.log] };
    const where = n <= KEYS_PER_PAGE ? `It is on key ${n}.` : 'It is on page 2 of the list.';
    const card: Card = {
      tone: 'neutral',
      glyph: 'plus',
      agent: NEW_SESSION.agent,
      title: `${NEW_SESSION.project} started`,
      sub: `${AGENT_NAMES[NEW_SESSION.agent]} on the PC. ${where}`,
    };
    if (this.canInterrupt()) this.flash(card, 2500);
    else this.emit();
  }

  // ---------- the PC link (live mode; handoff T15) ----------

  /** No pairing yet: the island shows how to pair (board IslandPair). */
  needPairing = () => {
    this.s.link = 'unpaired';
    this.show('pair');
  };

  /** The camera read a pairing code. */
  scanned = (pairing: Pairing) => {
    if (this.s.view !== 'pair') return;
    this.onPaired(pairing);
    this.s.link = 'connecting';
    this.collapse();
  };

  linkState = (state: LinkState) => {
    if (this.s.link === state) return;
    this.s.link = state;
    this.emit();
  };

  private keyOf(sessionId: string): number | undefined {
    for (const [k, v] of Object.entries(this.s.sessions)) if (v?.id === sessionId) return Number(k);
    return undefined;
  }

  /** Puts a session where the PC says; moves it if the PC gave it another key. */
  private place(info: SessionInfo): { n: number; before: Session | undefined } {
    const s = this.s;
    const old = this.keyOf(info.id);
    const before = old !== undefined ? s.sessions[old] ?? undefined : undefined;
    if (old !== undefined && old !== info.key) {
      delete s.sessions[old];
      for (const r of s.queue) if (r.session === old) r.session = info.key;
      if (s.selected === old) s.selected = info.key;
    }
    const levels = info.effort ? EFFORT_LEVELS.indexOf(info.effort) : -1;
    s.sessions[info.key] = {
      id: info.id,
      project: info.project,
      agent: info.agent,
      // Needs approval comes from the queue; keep the turn's own state under it.
      state: info.state === 'needsApproval' ? (isWorking(before) ? before!.state : 'thinking') : info.state,
      effort: levels >= 0 ? levels : (before?.effort ?? 2),
      log: [...info.tools],
      queued: before?.queued,
    };
    return { n: info.key, before };
  }

  private toRequest(r: PermissionRequest): Request {
    let n = this.keyOf(r.sessionId);
    if (n === undefined) {
      // The PC sends the session first; this is only a fallback.
      n = 1;
      while (this.s.sessions[n]) n += 1;
      this.s.sessions[n] = { id: r.sessionId, project: folderName(r.cwd), agent: 'claudeCode', state: 'thinking', effort: 2, log: [] };
    }
    const known = this.s.queue.find((q) => q.remoteId === r.id);
    return { id: known?.id ?? (this.requestIds += 1), remoteId: r.id, session: n, tool: r.tool, verb: verbFor(r.tool), body: r.summary };
  }

  /** Drops a spoken or saved reply whose request has gone. */
  private dropRepliesFor(requestIds: number[]) {
    const s = this.s;
    if (s.talk?.target.kind === 'reply' && requestIds.includes(s.talk.target.requestId)) {
      clearInterval(this.talkTimer);
      s.talk = null;
    }
    if (s.transcript?.target.kind === 'reply' && requestIds.includes(s.transcript.target.requestId)) s.transcript = null;
  }

  onAgent = (m: AgentMessage) => {
    const s = this.s;
    switch (m.t) {
      case 'ready': {
        // Everything the PC holds now replaces what the phone held (a reconnect catches up).
        const keep = s.sessions;
        s.sessions = {};
        for (const info of m.sessions) {
          const before = Object.values(keep).find((x) => x?.id === info.id);
          if (before) s.sessions[info.key] = before;
          this.place(info);
        }
        for (const n of Object.keys(s.sessions).map(Number)) {
          const session = s.sessions[n];
          if (session) session.queued = m.followups.find((f) => f.sessionId === session.id)?.text;
        }
        const queue = m.waiting.map((r) => this.toRequest(r));
        const gone = s.queue.filter((q) => !queue.some((r) => r.id === q.id)).map((q) => q.id);
        s.queue = queue;
        this.dropRepliesFor(gone);
        s.pcName = m.pcName;
        s.replies = m.replies;
        s.link = 'linked';
        if (s.selected !== null && !s.sessions[s.selected]) s.selected = null;
        if (s.queue.length && !s.talk && !s.transcript) return this.show('request');
        if (s.view === 'pair' || (s.view === 'request' && !s.queue.length) || (s.view === 'session' && s.selected === null)) return this.collapse();
        return this.emit();
      }
      case 'session': {
        const known = this.keyOf(m.session.id) !== undefined;
        const { n, before } = this.place(m.session);
        const now = s.sessions[n]!;
        let card: Card | null = null;
        if (!known) {
          const where = n <= KEYS_PER_PAGE ? `It is on key ${n}.` : 'It is on page 2 of the list.';
          card = { tone: 'neutral', glyph: 'plus', agent: now.agent, title: `${now.project} started`, sub: `${AGENT_NAMES[now.agent]} on the PC. ${where}` };
        } else if (isWorking(before) && now.state === 'finished') {
          card = { tone: 'green', glyph: 'check', title: `${now.project} finished`, sub: 'Its turn has ended.' };
        } else if (isWorking(before) && now.state === 'error') {
          card = { tone: 'red', glyph: 'cross', title: `${now.project} stopped on an error`, sub: 'Its turn ended on an API error.' };
        }
        if (card && this.canInterrupt()) return this.flash(card, 2500);
        return this.emit();
      }
      case 'sessionGone': {
        const n = this.keyOf(m.id);
        if (n === undefined) return;
        delete s.sessions[n];
        const gone = s.queue.filter((r) => r.session === n).map((r) => r.id);
        s.queue = s.queue.filter((r) => r.session !== n);
        this.dropRepliesFor(gone);
        if (s.talk?.target.session === n) {
          clearInterval(this.talkTimer);
          s.talk = null;
        }
        if (s.transcript?.target.session === n) s.transcript = null;
        if (s.effort?.session === n) s.effort = null;
        if (s.selected === n) {
          s.selected = null;
          if (s.view === 'session' || s.view === 'effort' || s.view === 'listening' || s.view === 'transcript') return this.next();
        }
        if (s.view === 'request' && !s.queue.length) return this.next();
        return this.emit();
      }
      case 'request': {
        if (s.queue.some((q) => q.remoteId === m.request.id)) return;
        s.queue.push(this.toRequest(m.request));
        // A new request while busy only joins the queue.
        if (s.talk || s.transcript || s.view === 'request' || s.view === 'pair') return this.emit();
        return this.show('request');
      }
      case 'resolved': {
        const req = s.queue.find((q) => q.remoteId === m.id);
        if (!req) return;
        const showing = this.requestShowing() && s.queue[0] === req;
        s.queue = s.queue.filter((q) => q !== req);
        this.dropRepliesFor([req.id]);
        if (s.selected === req.session && s.view !== 'session') s.selected = null;
        if (!showing) return s.view === 'transcript' && !s.transcript ? this.next() : this.emit();
        const name = this.name(req.session);
        return this.flash(
          m.how === 'timeout'
            ? { tone: 'amber', glyph: 'bang', title: 'Back to the terminal', sub: `${name}'s request waited too long. Answer it on the PC.` }
            : m.how === 'answered'
              ? { tone: 'neutral', glyph: 'check', title: 'Answered on the PC', sub: `${name}'s request was answered in the terminal.` }
              : { tone: 'neutral', glyph: 'undo', title: 'Request ended', sub: `${name} stopped asking.` },
          1800,
        );
      }
      case 'followupSent': {
        const n = this.keyOf(m.sessionId);
        if (n === undefined) return;
        const session = s.sessions[n]!;
        session.queued = undefined;
        const card: Card = { tone: 'blue', glyph: 'up', title: `${session.project} finished a turn`, sub: 'It has your follow-up now.' };
        if (this.canInterrupt()) return this.flash(card, 2500);
        return this.emit();
      }
      case 'replies':
        s.replies = m.replies;
        return this.emit();
      default:
        return undefined;
    }
  };

  // ---------- what the plate shows (K-3) ----------

  lights(): PlateLights {
    const s = this.s;
    const sessions: PlateLights['sessions'] = {};
    for (let n = 1; n <= KEYS_PER_PAGE; n += 1) {
      const session = s.sessions[n];
      if (!session) continue;
      const light: SessionLight | undefined = this.pendingFor(n)
        ? 'approval'
        : session.state === 'idle'
          ? undefined
          : session.state;
      if (light) sessions[`session${n}` as KeyId] = light;
    }
    const unlit: KeyId[] = [];
    const linked = s.link === 'linked';
    if (!(this.requestShowing() && s.armed && linked)) unlit.push('deny', 'allow', 'alwaysAllow');
    if (!s.transcript || !linked) unlit.push('send');
    if (!s.transcript && !this.cancelFollowUpAvailable()) unlit.push('cancel');
    return { linked, requestWaiting: s.queue.length > 0, sessions, unlit };
  }
}

export const island = new IslandStore();

/** Re-renders the caller whenever the island's state changes. */
export function useIsland(): IslandState {
  useSyncExternalStore(island.subscribe, island.getVersion, island.getVersion);
  return island.s;
}
