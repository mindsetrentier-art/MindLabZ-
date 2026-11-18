import { WORLD_CITATIONS_PART_1 } from './worldCitationsPart1';
import { WORLD_CITATIONS_PART_2 } from './worldCitationsPart2';

export interface WorldCitation {
  id: number;
  fr: string;
  zh: string;
  authorFr: string;
  authorZh: string;
  region: string;
}

export const WORLD_CITATIONS: WorldCitation[] = [
  ...WORLD_CITATIONS_PART_1,
  ...WORLD_CITATIONS_PART_2,
].map(([fr, zh, authorFr, authorZh, region], idx) => ({
  id: idx + 1,
  fr,
  zh,
  authorFr,
  authorZh,
  region,
}));

/**
 * Generates a freshly randomized Fisher-Yates permutation of all citation indices.
 * Guarantees no predictable ordering and avoids repeating `excludeFirstIndex`
 * immediately at the start of a new 500-citation cycle.
 */
export function createShuffledCitationDeck(excludeFirstIndex?: number): number[] {
  const deck = Array.from({ length: WORLD_CITATIONS.length }, (_, i) => i);

  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }

  if (
    excludeFirstIndex !== undefined &&
    deck.length > 1 &&
    deck[0] === excludeFirstIndex
  ) {
    const swapIdx = 1 + Math.floor(Math.random() * (deck.length - 1));
    const tmp = deck[0];
    deck[0] = deck[swapIdx];
    deck[swapIdx] = tmp;
  }

  return deck;
}
