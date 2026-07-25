import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// Interfaces for Request Types
interface CreateCategoryBody {
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
}

interface UpdateCategoryBody {
  name?: string;
  description?: string;
  iconUrl?: string;
  isActive?: boolean;
}

interface CategoryParams {
  sportId: string;
  categoryId: string;
}

interface GetCategoriesQuery {
  isActive?: string;
}

// ✅ CREATE CATEGORY FOR A SPORT
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sportId } = req.params as unknown as CategoryParams;
    const { name, slug, description, iconUrl } = req.body as CreateCategoryBody;

    if (!name || !slug) {
      res.status(400).json({ detail: 'Name and slug are required' });
      return;
    }

    // Verify sport exists
    const sport = await prisma.sport.findUnique({
      where: { id: sportId },
    });

    if (!sport) {
      res.status(404).json({ detail: 'Sport not found' });
      return;
    }

    // Check if category already exists for this sport
    const existingCategory = await prisma.sportCategory.findFirst({
      where: {
        sportId,
        slug,
      },
    });

    if (existingCategory) {
      res.status(409).json({ detail: 'Category with this slug already exists for this sport' });
      return;
    }

    const category = await prisma.sportCategory.create({
      data: {
        sportId,
        name,
        slug,
        description: description || null,
        iconUrl: iconUrl || null,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ GET ALL CATEGORIES FOR A SPORT
export const getCategoriesBySport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sportId } = req.params as unknown as CategoryParams;
    const { isActive } = req.query as GetCategoriesQuery;

    // Verify sport exists
    const sport = await prisma.sport.findUnique({
      where: { id: sportId },
    });

    if (!sport) {
      res.status(404).json({ detail: 'Sport not found' });
      return;
    }

    const where = {
      sportId,
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };

    const categories = await prisma.sportCategory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ GET SINGLE CATEGORY
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sportId, categoryId } = req.params as unknown as CategoryParams;

    const category = await prisma.sportCategory.findFirst({
      where: {
        id: categoryId,
        sportId,
      },
    });

    if (!category) {
      res.status(404).json({ detail: 'Category not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ UPDATE CATEGORY
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params as unknown as CategoryParams;
    const { name, description, iconUrl, isActive } = req.body as UpdateCategoryBody;

    const category = await prisma.sportCategory.update({
      where: { id: categoryId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(iconUrl && { iconUrl }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ DELETE CATEGORY
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params as unknown as CategoryParams;

    const category = await prisma.sportCategory.update({
      where: { id: categoryId },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};