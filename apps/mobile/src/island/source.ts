import { Platform } from 'react-native';

/**
 * TEMPORARY switch (handoff T15): what feeds the island. 'live' is the PC link;
 * 'demo' is the fake sessions in `demo.ts`, kept for design work. The web's
 * `?scene=` comparison views (scenes.ts) always use the demo, and so does
 * `?demo` in the address.
 */
const query = Platform.OS === 'web' && typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const forcedDemo = !!query && (query.has('scene') || query.has('demo'));

export const SOURCE: 'live' | 'demo' = forcedDemo ? 'demo' : ('live' as 'live' | 'demo');
