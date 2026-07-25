import { AggregationType, StatDefinition } from "../generated/prisma/client";


// Interfaces for JSON Stat payloads

/**
 * Merges a new match's stats into the existing careerStats JSON,
 * based on each key's AggregationType (fetched from StatDefinition).
*
 * @param existingStats - current careerStats JSON (or {})
 * @param newStats - this match's stats JSON, e.g. { runs: 45, wickets: 2 }
 * @param statDefinitions - StatDefinition rows for this sport (key -> aggregation)
 * @param prevMatchesPlayed - matchesPlayed BEFORE this insert
*/
export interface StatsMap {
  [key: string]: number;
}

export const mergeCareerStats = (
  existingStats: StatsMap = {},
  newStats: StatsMap,
  statDefinitions: Pick<StatDefinition, 'key' | 'aggregation'>[],
  prevMatchesPlayed: number
): StatsMap => {
  const defMap: Record<string, AggregationType> = {};
  statDefinitions.forEach((d) => {
    defMap[d.key] = d.aggregation;
  });

  const merged: StatsMap = { ...existingStats };
  const newCount = prevMatchesPlayed + 1;

  for (const key of Object.keys(newStats)) {
    const value = newStats[key];

    // ✅ Guard check: Skip if value is undefined or not a number
    if (value === undefined) {
      continue;
    }

    const aggType = defMap[key] || AggregationType.SUM;
    const prevValue = existingStats[key];

    switch (aggType) {
      case AggregationType.SUM:
        merged[key] = (prevValue || 0) + value;
        break;

      case AggregationType.AVERAGE: {
        const prevAvg = prevValue || 0;
        merged[key] = (prevAvg * prevMatchesPlayed + value) / newCount;
        break;
      }

      case AggregationType.MAX:
        merged[key] = prevValue === undefined ? value : Math.max(prevValue, value);
        break;

      case AggregationType.MIN:
        merged[key] = prevValue === undefined ? value : Math.min(prevValue, value);
        break;

      case AggregationType.LATEST:
        merged[key] = value;
        break;

      case AggregationType.NONE:
      default:
        merged[key] = value;
        break;
    }
  }

  return merged;
};