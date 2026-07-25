import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { DataType, StatDefinition } from '../generated/prisma/client';
import { mergeCareerStats } from '../utils/aggregationHelper';

// Type alias for stat dictionaries
type StatsMap = Record<string, number>;

// Interfaces for Request Data
interface RecordMatchStatBody {
  matchId: string;
  playerId: string;
  sportId: string;
  sportCategoryId: string;
  stats: Record<string, number>;
  playerRole?: string;
  playerTeam?: string;
  isSubstitute?: boolean;
  minutesPlayed?: number;
  performanceRating?: number;
}

interface BulkSeedStatsBody {
  playerIds: string[];
  matchIds: string[];
  sportId: string;
  sportCategoryId: string;
}

interface PlayerParams {
  playerId?: string;
}

interface GetPlayerStatsQuery {
  matchId?: string;
  limit?: string;
  page?: string;
}

interface GetCareerSummaryQuery {
  sportId?: string;
  sportCategoryId?: string;
}

// In-memory cache for stat definitions during heavy operations
const statDefCache: Record<string, StatDefinition[]> = {};

async function getStatDefinitions(sportId: string): Promise<StatDefinition[]> {
  if (!statDefCache[sportId]) {
    statDefCache[sportId] = await prisma.statDefinition.findMany({
      where: { sportId, isActive: true },
    });
  }
  return statDefCache[sportId];
}

// ✅ RECORD A SINGLE STAT (with live career summary update)
export const recordMatchStat = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      matchId,
      playerId,
      sportId,
      sportCategoryId,
      stats,
      playerRole,
      playerTeam,
      isSubstitute,
      minutesPlayed,
      performanceRating,
    } = req.body as RecordMatchStatBody;

    if (!matchId || !playerId || !sportId || !sportCategoryId || !stats) {
      res.status(400).json({ detail: 'matchId, playerId, sportId, sportCategoryId, stats are required' });
      return;
    }

    const start = Date.now();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create match stat entry
      const statRow = await tx.playerMatchStat.create({
        data: {
          matchId,
          playerId,
          sportId,
          sportCategoryId,
          stats,
          playerRole: playerRole || null,
          playerTeam: playerTeam || null,
          isSubstitute: isSubstitute || false,
          minutesPlayed: minutesPlayed || null,
          performanceRating: performanceRating || null,
        },
      });

      // 2. Fetch definitions for aggregation rules
      const defs = await tx.statDefinition.findMany({
        where: { sportId, isActive: true },
      });

      // 3. Fetch career summary
      const existingSummary = await tx.playerCareerSummary.findUnique({
        where: {
          playerId_sportId_sportCategoryId: { playerId, sportId, sportCategoryId },
        },
      });

      const prevMatchesPlayed = existingSummary?.matchesPlayed || 0;
      // ✅ Cast Prisma JSON field to StatsMap
      const prevCareerStats = (existingSummary?.careerStats ?? {}) as StatsMap;

      const mergedStats = mergeCareerStats(prevCareerStats, stats, defs, prevMatchesPlayed);

      // 4. Update career summary
      const summary = await tx.playerCareerSummary.upsert({
        where: {
          playerId_sportId_sportCategoryId: { playerId, sportId, sportCategoryId },
        },
        update: {
          matchesPlayed: prevMatchesPlayed + 1,
          careerStats: mergedStats,
        },
        create: {
          playerId,
          sportId,
          sportCategoryId,
          matchesPlayed: 1,
          careerStats: stats,
        },
      });

      return { statRow, summary };
    });

    const duration = Date.now() - start;

    res.status(201).json({
      success: true,
      durationMs: duration,
      data: result,
    });
  } catch (error) {
    console.error('Error recording match stat:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ BULK SEED STATS
export const bulkSeedStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { playerIds, matchIds, sportId, sportCategoryId } = req.body as BulkSeedStatsBody;

    if (!playerIds?.length || !matchIds?.length || !sportId || !sportCategoryId) {
      res.status(400).json({ detail: 'playerIds, matchIds, sportId, sportCategoryId are required' });
      return;
    }

    const defs = await getStatDefinitions(sportId);
    if (defs.length === 0) {
      res.status(400).json({ detail: 'No active StatDefinitions found for this sport' });
      return;
    }

    const overallStart = Date.now();
    const perPlayerTimings: Array<{ playerId: string; durationMs: number }> = [];
    let totalRows = 0;

    for (const playerId of playerIds) {
      const playerStart = Date.now();

      for (const matchId of matchIds) {
        const randomStats: Record<string, number> = {};

        defs.forEach((def) => {
          if (def.dataType === DataType.NUMBER) {
            randomStats[def.key] =
              Math.floor(Math.random() * ((def.maxValue || 100) - (def.minValue || 0) + 1)) +
              (def.minValue || 0);
          } else if (def.dataType === DataType.PERCENTAGE) {
            randomStats[def.key] = Math.round(Math.random() * 100 * 100) / 100;
          } else {
            randomStats[def.key] = 0;
          }
        });

        await prisma.$transaction(async (tx) => {
          await tx.playerMatchStat.create({
            data: {
              matchId,
              playerId,
              sportId,
              sportCategoryId,
              stats: randomStats,
            },
          });

          const existingSummary = await tx.playerCareerSummary.findUnique({
            where: { playerId_sportId_sportCategoryId: { playerId, sportId, sportCategoryId } },
          });

          const prevMatchesPlayed = existingSummary?.matchesPlayed || 0;
          // ✅ Cast Prisma JSON field to StatsMap
          const prevCareerStats = (existingSummary?.careerStats ?? {}) as StatsMap;
          const mergedStats = mergeCareerStats(prevCareerStats, randomStats, defs, prevMatchesPlayed);

          await tx.playerCareerSummary.upsert({
            where: { playerId_sportId_sportCategoryId: { playerId, sportId, sportCategoryId } },
            update: { matchesPlayed: prevMatchesPlayed + 1, careerStats: mergedStats },
            create: { playerId, sportId, sportCategoryId, matchesPlayed: 1, careerStats: randomStats },
          });
        });

        totalRows++;
      }

      perPlayerTimings.push({ playerId, durationMs: Date.now() - playerStart });
    }

    const overallDuration = Date.now() - overallStart;

    res.status(201).json({
      success: true,
      message: `${totalRows} PlayerMatchStat rows created with live career summary updates`,
      totalRows,
      overallDurationMs: overallDuration,
      avgMsPerRow: Math.round((overallDuration / totalRows) * 100) / 100,
      firstFivePlayers: perPlayerTimings.slice(0, 5),
      lastFivePlayers: perPlayerTimings.slice(-5),
    });
  } catch (error) {
    console.error('Error bulk seeding stats:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ GET PLAYER'S STATS
export const getPlayerStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { playerId } = req.params as unknown as PlayerParams;
    const { matchId, limit = '10', page = '1' } = req.query as GetPlayerStatsQuery;

    if (!playerId) {
      res.status(400).json({ detail: 'Player ID is required' });
      return;
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = { playerId, ...(matchId && { matchId }) };

    const start = Date.now();
    const [stats, total] = await Promise.all([
      prisma.playerMatchStat.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { match: true },
      }),
      prisma.playerMatchStat.count({ where }),
    ]);
    const duration = Date.now() - start;

    res.status(200).json({
      success: true,
      durationMs: duration,
      total,
      count: stats.length,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ GET PLAYER CAREER SUMMARY
export const getCareerSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { playerId } = req.params as unknown as PlayerParams;
    const { sportId, sportCategoryId } = req.query as GetCareerSummaryQuery;

    if (!playerId) {
      res.status(400).json({ detail: 'Player ID is required' });
      return;
    }

    const start = Date.now();
    const summaries = await prisma.playerCareerSummary.findMany({
      where: {
        playerId,
        ...(sportId && { sportId }),
        ...(sportCategoryId && { sportCategoryId }),
      },
    });
    const duration = Date.now() - start;

    res.status(200).json({
      success: true,
      durationMs: duration,
      data: summaries,
    });
  } catch (error) {
    console.error('Error fetching career summary:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};