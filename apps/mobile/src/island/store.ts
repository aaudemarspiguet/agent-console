import { useSyncExternalStore } from 'react';
import type { KeyId } from '@deck/protocol';
import type { PlateLights, SessionLight } from '../lights';
import {
  AGENT_NAMES,
  type AgentId,
  demoSessions,
  EFFORT_FAILS_ON,
  EFFORT_LEVELS,
  FOLLOW_UP,
  NEW_SESSION,
  REQUESTS,
  type Request,
  SAVED_REPLIES,
  type Session,
} from './demo';

/**
 * What the island shows and how it reacts to touches and keys (handoff T13).
 * The behaviour is ported from the clickable prototype ("Island Deck") and
 * checked against the brief; the text and the states are the mockups'. It is
 * driven by the demo sessions in `demo.ts` until it is wired to the PC link.
 */

export type View = 'list' | 'request' | 'session' | 'listening' | 'transcript' | 'effort' | 'result';
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
}

/** Time before the answer keys light, after a request shows (A-5; the user chose 0.6 s on 2026-11-14). */
export const ANSWER_DELAY_MS = 600;
/** Rows on a page of the session list: one per number key (A-2, K-10). */
export const KEYS_PER_PAGE = 6;
/** The quiet moment after the wheel stops before the change is sent (E-3). Not decided in the brief. */
const EFFORT_SEND_MS = 900;

const isWorking = (s: Session | null | undefined) => !!s && (s.state === 'running' || s.state === 'thinking');

class IslandStore {
  s: IslandState = {
    sessions: demoSessions(),
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
  };

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

  // ---------- touches on the island and plate (K-5) ----------

  /**
   * A tap on the screen: a result moves on, a request is hidden (A-4: it stays
   * in the queue, and the list shows its session needing approval), a session
   * view goes back to the list. Nothing happens on the list itself, or while
   * listening or showing a transcript.
   */
  tapIsland = () => {
    const s = this.s;
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
    s.selected = n;
    if (s.talk || s.transcript) return this.emit();
    const index = s.queue.findIndex((r) => r.session === n);
    if (index > 0) s.queue.unshift(s.queue.splice(index, 1)[0]);
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
    const req = target.kind === 'reply' ? s.queue.find((r) => r.id === target.requestId) : undefined;
    const phrase = req ? req.reply : FOLLOW_UP;
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
    s.transcript = { target, text: SAVED_REPLIES[id], saved: true };
    this.show('transcript');
  }

  private sendTranscript() {
    const s = this.s;
    const tr = s.transcript;
    if (!tr) return;
    s.transcript = null;
    const n = tr.target.session;
    const session = s.sessions[n];
    const name = this.name(n);
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
    this.s.sessions[n]!.queued = undefined;
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
    if (n === null || s.talk) return false;
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
    if (!(this.requestShowing() && s.armed)) unlit.push('deny', 'allow', 'alwaysAllow');
    if (!s.transcript) unlit.push('send');
    if (!s.transcript && !this.cancelFollowUpAvailable()) unlit.push('cancel');
    return { linked: true, requestWaiting: s.queue.length > 0, sessions, unlit };
  }
}

export const island = new IslandStore();

/** Re-renders the caller whenever the island's state changes. */
export function useIsland(): IslandState {
  useSyncExternalStore(island.subscribe, island.getVersion, island.getVersion);
  return island.s;
}
