import { useRef } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AGENT_NAMES, EFFORT_LEVELS, PC_NAME } from './demo';
import { AgentIcon, Badge, Caret, GREY, PulseDot, StatusGlyph, statusOf, type } from './parts';
import { island, KEYS_PER_PAGE, type IslandState, type View as IslandView } from './store';
import type { Side } from '../useCameraSide';

/** Open sizes (mockups): full height for reading, half height for results and effort. */
export const OPEN_WIDTH = 320;
export const FULL_HEIGHT = 378;
export const HALF_HEIGHT = 170;

export const isHalf = (view: IslandView | null) => view === 'result' || view === 'effort';

interface ViewProps {
  s: IslandState;
  side: Side;
  still: boolean;
}

/** Padding that keeps content clear of the camera cutout, on whichever side it is (K-8). */
function pad(side: Side, camera: number, other: number) {
  return side === 'left' ? { paddingLeft: camera, paddingRight: other } : { paddingRight: camera, paddingLeft: other };
}

/** The session header: number, agent icon, project name, status in its colour, status glyph. */
function Header({ s, n, still }: { s: IslandState; n: number; still: boolean }) {
  const session = s.sessions[n];
  if (!session) return null;
  const pending = island.pendingFor(n);
  const st = statusOf(session, pending);
  return (
    <View style={styles.header}>
      <Text style={type.number}>{n}</Text>
      <AgentIcon agent={session.agent} size={28} />
      <View style={styles.texts}>
        <Text style={type.title} numberOfLines={1}>
          {session.project}
        </Text>
        <Text style={[type.status, { color: st.color }]} numberOfLines={1}>
          {st.label}
        </Text>
      </View>
      <StatusGlyph session={session} pending={pending} still={still} />
    </View>
  );
}

function Full({ side, children }: { side: Side; children: React.ReactNode }) {
  return <View style={[styles.full, pad(side, 54, 16)]}>{children}</View>;
}

function Foot({ children, right }: { children: string; right?: string }) {
  return (
    <View style={styles.foot}>
      <Text style={[type.foot, styles.grow]}>{children}</Text>
      {right ? <Text style={type.foot}>{right}</Text> : null}
    </View>
  );
}

/** Board 2: the session list, one row per number key, a swipe for the next page (A-2, K-5). */
function List({ s, side, still }: ViewProps) {
  const pages = island.pages();
  const first = s.page * KEYS_PER_PAGE + 1;
  const numbers = Array.from({ length: KEYS_PER_PAGE }, (_, i) => first + i).filter((n) => s.page === 0 || s.sessions[n]);
  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) > 40) island.swipe(g.dx < 0 ? 1 : -1);
      },
    }),
  ).current;
  return (
    <Full side={side}>
      <View style={styles.grow} {...swipe.panHandlers}>
        <Text style={[type.title, styles.listTitle]}>Agents</Text>
        {numbers.map((n) => {
          const session = s.sessions[n];
          if (!session) {
            // An empty number key, as in the prototype (the user chose it on 2026-11-14).
            return (
              <View key={n} style={styles.row}>
                <Text style={type.number}>{n}</Text>
                <View style={styles.placeholder} />
                <View style={styles.texts}>
                  <Text style={[type.row, { color: GREY }]}>No session</Text>
                  <Text style={type.status}>Start an agent on your PC</Text>
                </View>
              </View>
            );
          }
          const pending = island.pendingFor(n);
          const st = statusOf(session, pending);
          return (
            <Pressable
              key={n}
              style={styles.row}
              onPress={() => island.tapRow(n)}
              accessibilityRole="button"
              accessibilityLabel={`Session ${n}: ${session.project}, ${st.label}`}
            >
              <Text style={type.number}>{n}</Text>
              <AgentIcon agent={session.agent} size={26} />
              <View style={styles.texts}>
                <Text style={type.row} numberOfLines={1}>
                  {session.project}
                </Text>
                <Text style={[type.status, { color: st.color }]} numberOfLines={1}>
                  {st.label}
                </Text>
              </View>
              <StatusGlyph session={session} pending={pending} still={still} />
            </Pressable>
          );
        })}
        <View style={styles.grow} />
        <View style={[styles.foot, { paddingTop: 0 }]}>
          <Text style={[type.foot, styles.grow]}>{`${PC_NAME} on Wi-Fi`}</Text>
          {pages > 1 ? (
            <View style={styles.dots} accessibilityRole="image" accessibilityLabel={`Page ${s.page + 1} of ${pages}, swipe to change`}>
              {Array.from({ length: pages }, (_, i) => (
                <View key={i} style={[styles.dot, i === s.page ? styles.dotOn : null]} />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Full>
  );
}

/** Board 3: a permission request (A-4). The command scrolls when long (K-5). */
function RequestView({ s, side, still }: ViewProps) {
  const req = s.queue[0];
  if (!req) return null;
  return (
    <Full side={side}>
      <Header s={s} n={req.session} still={still} />
      <Text style={[type.sub, styles.sub]}>{req.verb}</Text>
      <ScrollView style={styles.box} contentContainerStyle={styles.boxInner}>
        <Text style={type.code}>{req.body}</Text>
      </ScrollView>
      <Foot right="Tap to hide">{`Request 1 of ${s.queue.length}`}</Foot>
    </Full>
  );
}

/** Board 5: listening while Redirect is held. */
function Listening({ s, side, still }: ViewProps) {
  const talk = s.talk;
  if (!talk) return null;
  return (
    <Full side={side}>
      <Header s={s} n={talk.target.session} still={still} />
      <View style={[styles.subRow, styles.sub]}>
        <PulseDot size={8} color="#FF453A" period={900} glow={false} still={still} />
        <Text style={[type.sub, { color: '#FF453A' }]}>Listening</Text>
      </View>
      <View style={[styles.box, styles.boxInner]}>
        <Text style={[type.say, { color: GREY }]}>
          {talk.words.slice(0, talk.heard).join(' ')}
          <Caret still={still} />
        </Text>
      </View>
      <Foot>Let go of the key when you finish.</Foot>
    </Full>
  );
}

/** Board 6 and Reply 1: a transcript or a saved reply, waiting for Send or Cancel (V-2, R-2). */
function Transcript({ s, side, still }: ViewProps) {
  const tr = s.transcript;
  if (!tr) return null;
  const session = s.sessions[tr.target.session];
  const reply = tr.target.kind === 'reply';
  const label = tr.saved ? 'Saved Reply' : reply ? 'Your Reply' : 'Your Follow-Up';
  const foot = reply
    ? `Send denies the request and gives ${session ? AGENT_NAMES[session.agent] : 'the agent'} this reply.`
    : tr.saved
      ? 'Send queues this for the end of the turn.'
      : `Send queues this for ${session?.project ?? 'the session'}.`;
  return (
    <Full side={side}>
      <Header s={s} n={tr.target.session} still={still} />
      <Text style={[type.sub, styles.sub]}>{label}</Text>
      <View style={[styles.box, styles.boxInner]}>
        <Text style={type.say}>{tr.text}</Text>
      </View>
      <Foot>{foot}</Foot>
    </Full>
  );
}

/** Board 8: a session's view, with its last three tool calls (A-7, A-14). */
function SessionView({ s, side, still }: ViewProps) {
  const n = s.selected;
  const session = n !== null ? s.sessions[n] : null;
  if (n === null || !session) return null;
  const working = session.state === 'running' || session.state === 'thinking';
  const foot = session.queued
    ? 'Your follow-up waits for the end of the turn. Cancel removes it.'
    : working
      ? 'Hold redirect to queue a follow-up.'
      : 'Not working. Start its next prompt on your PC.';
  return (
    <Full side={side}>
      <Header s={s} n={n} still={still} />
      <Text style={[type.sub, styles.sub]}>{`${AGENT_NAMES[session.agent]} on ${PC_NAME}. Recent tool calls:`}</Text>
      <View style={[styles.box, styles.boxInner, styles.calls]}>
        {session.log.slice(-3).map((line, i) => (
          <Text key={i} style={[type.code, styles.call]}>
            {line}
          </Text>
        ))}
        {session.queued ? (
          <Text style={type.code} numberOfLines={2}>{`Queued: “${session.queued}”`}</Text>
        ) : null}
      </View>
      <Foot>{foot}</Foot>
    </Full>
  );
}

/** Effort 1: the wheel is turning (E-2). */
function Effort({ s, side, still }: ViewProps) {
  const e = s.effort;
  if (!e) return null;
  return (
    <View style={[styles.full, styles.effort, pad(side, 54, 16)]}>
      <Header s={s} n={e.session} still={still} />
      <View
        style={styles.ebar}
        accessibilityRole="image"
        accessibilityLabel={`Effort: ${EFFORT_LEVELS[e.from]} now, ${EFFORT_LEVELS[e.to]} chosen`}
      >
        {EFFORT_LEVELS.map((level, i) => (
          <View key={level} style={[styles.segment, i <= e.to ? styles.segmentOn : null]} />
        ))}
      </View>
      <View style={styles.elabels}>
        {EFFORT_LEVELS.map((level, i) => (
          <Text key={level} style={[styles.elabel, i === e.to ? styles.elabelOn : null]} numberOfLines={1}>
            {level}
          </Text>
        ))}
      </View>
      <View style={styles.grow} />
      <View style={[styles.foot, { paddingTop: 0 }]}>
        <Text style={type.foot}>{`Effort was ${EFFORT_LEVELS[e.from]}. Keep turning or stop.`}</Text>
      </View>
    </View>
  );
}

/** Half-height cards: results, events and hints. */
function CardView({ s, side }: ViewProps) {
  const card = s.card;
  if (!card) return null;
  return (
    <View style={[styles.half, pad(side, 56, 18)]}>
      {card.agent ? <AgentIcon agent={card.agent} size={40} /> : <Badge tone={card.tone} glyph={card.glyph} />}
      <View style={styles.texts}>
        <Text style={type.title} numberOfLines={2}>
          {card.title}
        </Text>
        <Text style={type.status} numberOfLines={3}>
          {card.sub}
        </Text>
      </View>
    </View>
  );
}

export function OpenView({ view, ...props }: ViewProps & { view: IslandView }) {
  switch (view) {
    case 'list':
      return <List {...props} />;
    case 'request':
      return <RequestView {...props} />;
    case 'listening':
      return <Listening {...props} />;
    case 'transcript':
      return <Transcript {...props} />;
    case 'session':
      return <SessionView {...props} />;
    case 'effort':
      return <Effort {...props} />;
    case 'result':
      return <CardView {...props} />;
  }
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 14,
  },
  effort: {
    paddingTop: 14,
    paddingBottom: 12,
  },
  half: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  grow: {
    flexGrow: 1,
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  sub: {
    paddingTop: 12,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  box: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
  },
  boxInner: {
    padding: 12,
  },
  calls: {
    gap: 6,
  },
  call: {
    color: 'rgba(235,235,245,0.78)',
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  listTitle: {
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  placeholder: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(235,235,245,0.25)',
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(235,235,245,0.3)',
  },
  dotOn: {
    backgroundColor: '#FFFFFF',
  },
  ebar: {
    flexDirection: 'row',
    gap: 4,
    paddingTop: 12,
    paddingHorizontal: 2,
    paddingBottom: 5,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  segmentOn: {
    backgroundColor: '#FFFFFF',
  },
  elabels: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 2,
  },
  elabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
    color: GREY,
  },
  elabelOn: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
