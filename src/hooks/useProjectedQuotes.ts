import { useMemo } from 'react';

// Seeded random for consistent "today" count
const getDailyRandom = (seed: string, min: number, max: number) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const random = (Math.abs(hash) % 1000) / 1000;
  return Math.floor(random * (max - min + 1)) + min;
};

// Configuration constants
const START_DATE = new Date('2024-02-12');
const BASE_TOTAL = 0;
const GROWTH_RATE = 4.9;
const TODAY_MIN = 12;
const TODAY_MAX = 28;

/**
 * Client-side fallback for quote ticker stats. Calculates projected
 * total and today's quote count using a seeded daily random and linear growth.
 * @returns `{ total, today }` — projected quote counts
 */
export function useProjectedQuotes() {
  return useMemo(() => {
    const now = new Date();
    
    const daysPassed = Math.floor(
      (now.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const todayString = now.toISOString().split('T')[0];
    const today = getDailyRandom(todayString, TODAY_MIN, TODAY_MAX);

    const total = Math.floor(BASE_TOTAL + (daysPassed * GROWTH_RATE) + today);

    return { total, today };
  }, []);
}
