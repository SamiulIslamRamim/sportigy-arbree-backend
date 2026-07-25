import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { MatchResult } from '../generated/prisma/enums';
import { Prisma } from '../generated/prisma/client';


// Interfaces for Request Data
interface CreateMatchBody {
  sportId: string;
  sportCategoryId: string;
  matchDate: string;
  opponent?: string;
  venue?: string;
  tournament?: string;
  matchType?: string;
  homeTeam?: string;
  awayTeam?: string;
  matchResult?: MatchResult;
}

interface BulkCreateMatchesBody {
  sportId: string;
  sportCategoryId: string;
  count?: number;
}

interface GetAllMatchesQuery {
  sportId?: string;
  sportCategoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  limit?: string;
}

// ✅ CREATE SINGLE MATCH
export const createMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      sportId,
      sportCategoryId,
      matchDate,
      opponent,
      venue,
      tournament,
      matchType,
      homeTeam,
      awayTeam,
      matchResult,
    } = req.body as CreateMatchBody;

    if (!sportId || !sportCategoryId || !matchDate) {
      res.status(400).json({ detail: 'sportId, sportCategoryId, and matchDate are required' });
      return;
    }

    const match = await prisma.match.create({
      data: {
        sportId,
        sportCategoryId,
        matchDate: new Date(matchDate),
        opponent: opponent || null,
        venue: venue || null,
        tournament: tournament || null,
        matchType: matchType || null,
        homeTeam: homeTeam || null,
        awayTeam: awayTeam || null,
        matchResult: matchResult || null,
        isActive: true,
      },
    });

    res.status(201).json({ success: true, data: match });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ BULK CREATE MATCHES
export const bulkCreateMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sportId, sportCategoryId, count } = req.body as BulkCreateMatchesBody;
    const total = count || 50;

    if (!sportId || !sportCategoryId) {
      res.status(400).json({ detail: 'sportId and sportCategoryId are required' });
      return;
    }

    const start = Date.now();
    const baseDate = new Date('2024-01-01');

// Array of typed Enum values
const results: MatchResult[] = [MatchResult.WIN, MatchResult.LOSS, MatchResult.DRAW];

const matchesToCreate: Prisma.MatchCreateManyInput[] = Array.from({ length: total }).map((_, i) => {
  const matchDate = new Date(baseDate);
  matchDate.setDate(matchDate.getDate() + i * 3);

  return {
    id: crypto.randomUUID(),
    sportId,
    sportCategoryId,
    matchDate,
    opponent: `Opponent ${i + 1}`,
    venue: `Venue ${(i % 5) + 1}`,
    tournament: 'Test Series',
    homeTeam: 'Home Team',
    awayTeam: `Away Team ${i + 1}`,
    // Explicitly cast to the Prisma enum type (handles exactOptionalPropertyTypes)
    matchResult: (results[i % 3] || MatchResult.WIN) as MatchResult,
    isActive: true,
  };
});

    const batchSize = 25;
    let insertedCount = 0;

    for (let i = 0; i < matchesToCreate.length; i += batchSize) {
      const batch = matchesToCreate.slice(i, i + batchSize);
      const result = await prisma.match.createMany({ data: batch });
      insertedCount += result.count;
    }

    const duration = Date.now() - start;

    res.status(201).json({
      success: true,
      message: `${insertedCount} matches created`,
      count: insertedCount,
      durationMs: duration,
      matchIds: matchesToCreate.map((m) => m.id),
    });
  } catch (error) {
    console.error('Error bulk creating matches:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ GET MATCHES (filtered)
export const getAllMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sportId, sportCategoryId, dateFrom, dateTo, page = '1', limit = '20' } =
      req.query as GetAllMatchesQuery;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      ...(sportId && { sportId }),
      ...(sportCategoryId && { sportCategoryId }),
      ...(dateFrom || dateTo
        ? {
            matchDate: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          }
        : {}),
    };

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { matchDate: 'desc' },
      }),
      prisma.match.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total,
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};