import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AggregationType, DataType } from '../generated/prisma/enums';
import { Prisma } from '../generated/prisma/client';

// Interfaces for Request Data
interface CreateStatDefinitionBody {
  key: string;
  label: string;
  description?: string;
  dataType?: DataType;
  aggregation?: AggregationType;
  minValue?: number;
  maxValue?: number;
  unit?: string;
  isRequired?: boolean;
}

interface BulkCreateStatDefinitionsBody {
  stats: Array<{
    key: string;
    label: string;
    description?: string;
    dataType?: string;
    aggregation?: string;
    minValue?: number;
    maxValue?: number;
    unit?: string;
    isRequired?: boolean;
    displayOrder?: number;
  }>;
}

interface UpdateStatDefinitionBody {
  label?: string;
  description?: string;
  minValue?: number;
  maxValue?: number;
  unit?: string;
  displayOrder?: number;
  isActive?: boolean;
}

interface StatDefinitionParams {
  sportId?: string;
  statId?: string;
}

interface GetStatDefinitionsQuery {
  isActive?: string;
}

// ✅ CREATE STAT DEFINITION FOR A SPORT
export const createStatDefinition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sportId } = req.params as unknown as StatDefinitionParams;
    const { key, label, description, dataType, aggregation, minValue, maxValue, unit, isRequired } = req.body as CreateStatDefinitionBody;

    if (!sportId) {
      res.status(400).json({ detail: 'Sport ID is required' });
      return;
    }

    if (!key || !label) {
      res.status(400).json({ detail: 'Key and label are required' });
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

    // Check if stat definition already exists for this sport
    const existingDef = await prisma.statDefinition.findFirst({
      where: {
        sportId,
        key,
      },
    });

    if (existingDef) {
      res.status(409).json({ detail: 'Stat definition with this key already exists for this sport' });
      return;
    }

    const statDef = await prisma.statDefinition.create({
      data: {
        sportId,
        key,
        label,
        description: description || null,
        dataType: dataType || 'NUMBER',
        aggregation: aggregation || 'SUM',
        minValue: minValue ?? null,
        maxValue: maxValue ?? null,
        unit: unit || null,
        isRequired: isRequired || false,
        isActive: true,
        displayOrder: 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Stat definition created successfully',
      data: statDef,
    });
  } catch (error) {
    console.error('Error creating stat definition:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ BULK CREATE STAT DEFINITIONS (For faster setup)
export const bulkCreateStatDefinitions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sportId } = req.params as unknown as StatDefinitionParams;
    const { stats } = req.body as BulkCreateStatDefinitionsBody;

    if (!sportId) {
      res.status(400).json({ detail: 'Sport ID is required' });
      return;
    }

    if (!Array.isArray(stats) || stats.length === 0) {
      res.status(400).json({ detail: 'Stats array is required and cannot be empty' });
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

    const statsToCreate: Prisma.StatDefinitionCreateManyInput[] = stats.map((stat, index) => ({
      sportId,
      key: stat.key,
      label: stat.label,
      description: stat.description || null,
      dataType: (stat.dataType || DataType.NUMBER) as DataType,
      aggregation: (stat.aggregation || AggregationType.SUM) as AggregationType,
      minValue: stat.minValue ?? null,
      maxValue: stat.maxValue ?? null,
      unit: stat.unit || null,
      isRequired: stat.isRequired || false,
      displayOrder: stat.displayOrder ?? index,
      isActive: true,
    }));   

    // ✅ Fix: Add skipDuplicates true
    const createdStats = await prisma.statDefinition.createMany({
      data: statsToCreate,
      skipDuplicates: true, // Ignores keys that already exist for this sportId
    });

    res.status(201).json({
      success: true,
      message: `${createdStats.count} stat definitions created successfully`,
      count: createdStats.count,
    });
  } catch (error) {
    console.error('Error creating stat definitions:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ GET ALL STAT DEFINITIONS FOR A SPORT
export const getStatDefinitionsBySport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sportId } = req.params as unknown as StatDefinitionParams;
    const { isActive } = req.query as GetStatDefinitionsQuery;

    if (!sportId) {
      res.status(400).json({ detail: 'Sport ID is required' });
      return;
    }

    // Verify sport exists
    // const sport = await prisma.sport.findUnique({
    //   where: { id: sportId },
    // });

    // if (!sport) {
    //   res.status(404).json({ detail: 'Sport not found' });
    //   return;
    // }

    const where = {
      sportId,
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };

    const stats = await prisma.statDefinition.findMany({
      where,
    
    });

    console.log(stats)

    res.status(200).json({
      success: true,
      count: stats.length,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching stat definitions:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ GET SINGLE STAT DEFINITION
export const getStatDefinitionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { statId } = req.params as unknown as StatDefinitionParams;

    if (!statId) {
      res.status(400).json({ detail: 'Stat ID is required' });
      return;
    }

    const stat = await prisma.statDefinition.findUnique({
      where: { id: statId },
    });

    if (!stat) {
      res.status(404).json({ detail: 'Stat definition not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: stat,
    });
  } catch (error) {
    console.error('Error fetching stat definition:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ UPDATE STAT DEFINITION
export const updateStatDefinition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { statId } = req.params as unknown as StatDefinitionParams;
    const { label, description, minValue, maxValue, unit, displayOrder, isActive } = req.body as UpdateStatDefinitionBody;

    if (!statId) {
      res.status(400).json({ detail: 'Stat ID is required' });
      return;
    }

    const stat = await prisma.statDefinition.update({
      where: { id: statId },
      data: {
        ...(label && { label }),
        ...(description && { description }),
        ...(minValue !== undefined && { minValue }),
        ...(maxValue !== undefined && { maxValue }),
        ...(unit && { unit }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Stat definition updated successfully',
      data: stat,
    });
  } catch (error) {
    console.error('Error updating stat definition:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};

// ✅ DELETE STAT DEFINITION
export const deleteStatDefinition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { statId } = req.params as unknown as StatDefinitionParams;

    if (!statId) {
      res.status(400).json({ detail: 'Stat ID is required' });
      return;
    }

    const stat = await prisma.statDefinition.update({
      where: { id: statId },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: 'Stat definition deleted successfully',
      data: stat,
    });
  } catch (error) {
    console.error('Error deleting stat definition:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
};