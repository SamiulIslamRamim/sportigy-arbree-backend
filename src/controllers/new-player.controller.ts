import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import crypto from 'crypto';

// Interfaces for Request Data
interface CreatePlayerBody {
  email: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  avatarUrl?: string;
  bio?: string;
}

interface BulkCreatePlayersBody {
  count?: number;
}

interface PlayerParams {
  playerId?: string;
}

interface GetAllPlayersQuery {
  page?: string;
  limit?: string;
}

// ✅ CREATE SINGLE PLAYER
export const createPlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, fullName, phone, dateOfBirth, nationality, avatarUrl, bio } = req.body as CreatePlayerBody;

    if (!email || !fullName) {
      res.status(400).json({ detail: 'email and fullName are required' });
      return;
    }

    const player = await prisma.player.create({
      data: {
        email,
        fullName,
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        nationality: nationality || null,
        avatarUrl: avatarUrl || null,
        bio: bio || null,
        isActive: true,
      },
    });

    res.status(201).json({ success: true, data: player });
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ BULK CREATE PLAYERS (for load testing — e.g. count: 100)
export const bulkCreatePlayers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { count } = req.body as BulkCreatePlayersBody;
    const total = count || 100;

    const start = Date.now();

    // Generate IDs ourselves so we can reference them immediately
    const playersToCreate = Array.from({ length: total }).map((_, i) => ({
      id: crypto.randomUUID(),
      email: `player${i + 1}_${Date.now()}@test.com`,
      fullName: `Test Player ${i + 1}`,
      nationality: 'Testland',
      isActive: true,
    }));

    // Batch inserts to avoid a single giant query (batches of 50)
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < playersToCreate.length; i += batchSize) {
      const batch = playersToCreate.slice(i, i + batchSize);
      const result = await prisma.player.createMany({ data: batch });
      insertedCount += result.count;
    }

    const duration = Date.now() - start;

    res.status(201).json({
      success: true,
      message: `${insertedCount} players created`,
      count: insertedCount,
      durationMs: duration,
      playerIds: playersToCreate.map((p) => p.id),
    });
  } catch (error) {
    console.error('Error bulk creating players:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ GET ALL PLAYERS (paginated)
export const getAllPlayers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query as GetAllPlayersQuery;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.player.count(),
    ]);

    res.status(200).json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total,
      count: players.length,
      data: players,
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ GET SINGLE PLAYER
export const getPlayerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { playerId } = req.params as unknown as PlayerParams;

    if (!playerId) {
      res.status(400).json({ detail: 'Player ID is required' });
      return;
    }

    const player = await prisma.player.findUnique({ where: { id: playerId } });

    if (!player) {
      res.status(404).json({ detail: 'Player not found' });
      return;
    }

    res.status(200).json({ success: true, data: player });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};