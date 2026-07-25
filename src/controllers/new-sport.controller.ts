import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

// Interfaces for Request Types
interface CreateSportBody {
  name: string;
  slug: string;
  description?: string;
}

interface UpdateSportBody {
  name?: string;
  description?: string;
  isActive?: boolean;
}

interface SportParams {
  sportId: string;
}

interface GetAllSportsQuery {
  isActive?: string;
}

// ✅ CREATE SPORT
// ✅ CREATE SPORT
export const createSport = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fallback to empty object if req.body is undefined
    const { name, slug, description } = (req.body || {}) as CreateSportBody;

    if (!name || !slug) {
      res.status(400).json({ detail: 'Name and slug are required' });
      return;
    }

    const existingSport = await prisma.sport.findUnique({
      where: { slug },
    });

    if (existingSport) {
      res.status(409).json({ detail: 'Sport with this slug already exists' });
      return;
    }

    const sport = await prisma.sport.create({
      data: {
        name,
        slug,
        description: description || null,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Sport created successfully',
      data: sport,
    });
  } catch (error) {
    console.error('Error creating sport:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ GET ALL SPORTS
export const getAllSports = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive } = req.query as GetAllSportsQuery;

    const where = isActive !== undefined ? { isActive: isActive === 'true' } : {};

    const sports = await prisma.sport.findMany({
      where,
      include: {
        categories: true,
        definitions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: sports.length,
      data: sports,
    });
  } catch (error) {
    console.error('Error fetching sports:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ GET SINGLE SPORT WITH ALL DETAILS
export const getSportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sportId } = req.params as unknown as SportParams;

    const sport = await prisma.sport.findUnique({
      where: { id: sportId },
      include: {
        categories: {
          where: { isActive: true },
        },
        definitions: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!sport) {
      res.status(404).json({ detail: 'Sport not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: sport,
    });
  } catch (error) {
    console.error('Error fetching sport:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ UPDATE SPORT
export const updateSport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sportId } = req.params as unknown as SportParams;
    const { name, description, isActive } = req.body as UpdateSportBody;

    const sport = await prisma.sport.update({
      where: { id: sportId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Sport updated successfully',
      data: sport,
    });
  } catch (error) {
    console.error('Error updating sport:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ DELETE SPORT (Soft delete)
export const deleteSport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sportId } = req.params as unknown as SportParams;

    const sport = await prisma.sport.update({
      where: { id: sportId },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: 'Sport deleted successfully',
      data: sport,
    });
  } catch (error) {
    console.error('Error deleting sport:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};