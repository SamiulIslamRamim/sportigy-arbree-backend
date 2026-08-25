import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createSportFieldSchema,
  fieldParamsSchema,
  fieldSectionQuerySchema,
  sportParamsSchema,
  updateSportFieldSchema,
} from "../../schemas/sport.schema";
import {
  assertNonEmptyUpdate,
  assertSportExists,
  parseBody,
  parseParams,
  parseQueryEnum,
  slugify,
} from "../../utils/helper";
import { prisma } from "../../config/prisma.js";
import { ResponseHandler } from "../../utils/Responsehandler";
import {
  FieldSection,
  FieldType,
  FormulaRole,
} from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import { ERROR_CODES } from "../../constants/errorCodes";
import { AppError } from "../../utils/AppError";

type FormulaComponentInput = { sourceFieldId: string; role: FormulaRole };

/**
 * Server-side constraint checks for a field that is (or is becoming) computed.
 *  - type must be NUMBER, section MATCH, required forced false
 *  - metricId (if provided) must exist, belong to the sport, and be active (computed or not)
 *  - formulaComponents: at least one NUMERATOR + one DENOMINATOR, no self-reference,
 *    every source field in the same sport, section MATCH, type NUMBER, isComputed false.
 *
 * `requireComponents` is only true when the caller must supply components now
 * (create-as-computed, or an update that replaces components / turns computed on).
 */
const validateComputedConfig = async (
  sportId: string,
  opts: {
    isComputed: boolean;
    requireComponents: boolean;
    section: FieldSection;
    type: FieldType;
    required: boolean;
    metricId: string | null;
    formulaComponents?: FormulaComponentInput[];
    existingId?: string;
  },
): Promise<void> => {
  const effectiveRequired = opts.required;
  const components = opts.formulaComponents ?? [];

  if (opts.metricId !== null) {
    const metric = await prisma.sportMetric.findFirst({
      where: { id: opts.metricId, sportId },
      select: { id: true },
    });
    if (!metric) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
        data: {
          metricId: "Metric does not belong to this sport or does not exist",
        },
      });
    }
  }

  if (opts.isComputed) {
    if (opts.type !== FieldType.NUMBER) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
        data: { type: "A computed field must be of type NUMBER" },
      });
    }
    if (opts.section !== FieldSection.MATCH) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
        data: { section: "A computed field must be in the MATCH section" },
      });
    }
    if (effectiveRequired) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
        data: {
          required: "A computed field can never be required (value is derived)",
        },
      });
    }

    if (opts.requireComponents) {
      if (components.length === 0) {
        throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
          data: {
            formulaComponents: "At least one formula component is required",
          },
        });
      }

      const numerators = components.filter(
        (c) => c.role === FormulaRole.NUMERATOR,
      );
      const denominators = components.filter(
        (c) => c.role === FormulaRole.DENOMINATOR,
      );
      if (numerators.length === 0) {
        throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
          data: {
            formulaComponents: "At least one NUMERATOR component is required",
          },
        });
      }
      if (denominators.length === 0) {
        throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
          data: {
            formulaComponents: "At least one DENOMINATOR component is required",
          },
        });
      }
      const numeratorIds = new Set(numerators.map((c) => c.sourceFieldId));
      if (denominators.some((c) => numeratorIds.has(c.sourceFieldId))) {
        throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
          data: {
            formulaComponents:
              "A source field cannot be used as both NUMERATOR and DENOMINATOR",
          },
        });
      }

      const componentSelfRef = components.some(
        (c) => c.sourceFieldId === opts.existingId,
      );
      if (componentSelfRef) {
        throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
          data: {
            formulaComponents: "A computed field cannot reference itself",
          },
        });
      }

      const dupComponent = components.some(
        (c, i) =>
          components.findIndex(
            (d) => d.sourceFieldId === c.sourceFieldId && d.role === c.role,
          ) !== i,
      );
      if (dupComponent) {
        throw new AppError(ERROR_CODES.DUPLICATE_ENTRY, {
          data: {
            formulaComponents:
              "Duplicate (sourceFieldId, role) in formula components",
          },
        });
      }
    }

    if (components.length > 0) {
      const sourceIds = [...new Set(components.map((c) => c.sourceFieldId))];
      const sources = await prisma.sportField.findMany({
        where: { id: { in: sourceIds }, sportId },
        select: { id: true, section: true, type: true, isComputed: true },
      });
      const sourceMap = new Map(sources.map((s) => [s.id, s]));

      for (const c of components) {
        const source = sourceMap.get(c.sourceFieldId);
        if (!source) {
          throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
            data: {
              sourceFieldId: `Unknown or not-in-sport source field: ${c.sourceFieldId}`,
            },
          });
        }
        if (source.section !== FieldSection.MATCH) {
          throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
            data: {
              sourceFieldId: `Source field must be in MATCH section: ${c.sourceFieldId}`,
            },
          });
        }
        if (source.type !== FieldType.NUMBER) {
          throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
            data: {
              sourceFieldId: `Source field must be of type NUMBER: ${c.sourceFieldId}`,
            },
          });
        }
        if (source.isComputed) {
          throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
            data: {
              sourceFieldId: `Source field cannot itself be computed: ${c.sourceFieldId}`,
            },
          });
        }
      }
    }
  }
};

const formulaComponentsData = (components: FormulaComponentInput[]) =>
  components.map((c) => ({
    sourceFieldId: c.sourceFieldId,
    role: c.role,
  }));

export const getSportFields = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId } = parseParams(sportParamsSchema, req.params);
    await assertSportExists(sportId);

    const section = parseQueryEnum(req.query.section, fieldSectionQuerySchema);

    const fields = await prisma.sportField.findMany({
      where: {
        sportId,
        ...(section !== undefined && { section }),
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: {
        options: { orderBy: { createdAt: "asc" } },
        metric: { select: { id: true, name: true, slug: true } },
        formulaComponents: {
          include: {
            sourceField: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    ResponseHandler.success(res, "Data found.", { fields });
  },
);

export const createSportField = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId } = parseParams(sportParamsSchema, req.params);
    const body = parseBody(createSportFieldSchema, req.body);
    await assertSportExists(sportId);

    const name = body.name.trim();
    const slug = body.slug?.trim() ?? slugify(name);
    const { section, type } = body;

    const isComputed = body.isComputed ?? false;
    const formulaComponents = body.formulaComponents ?? [];
    const hasFormula = formulaComponents.length > 0;

    if (hasFormula && !isComputed) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
        data: {
          formulaComponents: "Formula components require isComputed = true",
        },
      });
    }

    const hasOptions = (body.options?.length ?? 0) > 0;
    const isSelectType =
      type === FieldType.SELECT || type === FieldType.MULTI_SELECT;
    if (hasOptions && !isSelectType) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT);
    }
    if (section === FieldSection.MATCH && !body.metricId) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
        data: { metricId: "metricId is required for MATCH section fields" },
      });
    }
    if (section === FieldSection.PROFILE && body.metricId) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
        data: {
          metricId: "metricId is not allowed for PROFILE section fields",
        },
      });
    }

    await validateComputedConfig(sportId, {
      isComputed,
      requireComponents: isComputed,
      section,
      type,
      required: body.required ?? false,
      metricId: body.metricId ?? null,
      formulaComponents,
    });

    const existing = await prisma.sportField.findUnique({
      where: { sportId_section_slug: { sportId, section, slug } },
    });
    if (existing) throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);

    const optionValues = (body.options ?? []).map(
      (o) => o.value?.trim() ?? slugify(o.label),
    );
    if (new Set(optionValues).size !== optionValues.length) {
      throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);
    }

    const field = await prisma.sportField.create({
      data: {
        sportId,
        name,
        slug,
        section,
        type,
        description: body.description ?? null,
        required: isComputed ? false : (body.required ?? false),
        searchable: body.searchable ?? true,
        filterable: body.filterable ?? true,
        sortable: body.sortable ?? false,
        displayOrder: body.displayOrder ?? 0,
        isActive: body.isActive ?? true,
        ...(body.metricId !== undefined && {
          metricId: body.metricId ?? null,
        }),
        ...(isComputed && {
          isComputed: true,
          formulaMultiplier:
            body.formulaMultiplier !== undefined
              ? body.formulaMultiplier
              : null,
        }),
        ...(hasFormula && {
          formulaComponents: {
            create: formulaComponentsData(formulaComponents),
          },
        }),
        ...(hasOptions && {
          options: {
            create: (body.options ?? []).map((opt) => ({
              label: opt.label.trim(),
              value: opt.value?.trim() ?? slugify(opt.label),
              isDefault: opt.isDefault ?? false,
              isActive: opt.isActive ?? true,
            })),
          },
        }),
      },
      include: {
        options: { orderBy: { createdAt: "asc" } },
        metric: { select: { id: true, name: true, slug: true } },
        formulaComponents: {
          include: {
            sourceField: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    ResponseHandler.success(res, "Field created successfully.", { field }, 201);
  },
);

export const getSportFieldById = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId, fieldId } = parseParams(fieldParamsSchema, req.params);

    const field = await prisma.sportField.findFirst({
      where: { id: fieldId, sportId },
      include: {
        options: { orderBy: { createdAt: "asc" } },
        metric: { select: { id: true, name: true, slug: true } },
        formulaComponents: {
          include: {
            sourceField: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    if (!field) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    ResponseHandler.success(res, "Data found.", { field });
  },
);

export const updateSportField = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId, fieldId } = parseParams(fieldParamsSchema, req.params);
    const body = parseBody(updateSportFieldSchema, req.body);
    assertNonEmptyUpdate(body);

    const existing = await prisma.sportField.findFirst({
      where: { id: fieldId, sportId },
      select: {
        id: true,
        sportId: true,
        name: true,
        slug: true,
        section: true,
        type: true,
        required: true,
        metricId: true,
        isComputed: true,
        isActive: true,
      },
    });
    if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    const name = body.name?.trim() ?? existing.name;
    const slug =
      body.slug?.trim() ??
      (body.name !== undefined ? slugify(name) : existing.slug);
    const section = body.section ?? existing.section;
    const type = body.type ?? existing.type;
    const metricId =
      body.metricId !== undefined ? body.metricId : existing.metricId;

    if (
      body.name !== undefined ||
      body.slug !== undefined ||
      body.section !== undefined
    ) {
      const conflict = await prisma.sportField.findFirst({
        where: {
          AND: [{ id: { not: fieldId } }, { sportId }, { section }, { slug }],
        },
      });
      if (conflict) throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);
    }

    const effectiveIsComputed = body.isComputed ?? existing.isComputed;
    const formulaComponents = body.formulaComponents ?? [];
    const hasFormula = formulaComponents.length > 0;

    // A computed field's required flag is always forced to false.
    const nextRequired: boolean | undefined = effectiveIsComputed
      ? false
      : body.required !== undefined
        ? body.required
        : existing.required;

    if (hasFormula && !effectiveIsComputed) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
        data: {
          formulaComponents: "Formula components require isComputed = true",
        },
      });
    }
    if (
      body.formulaComponents !== undefined &&
      effectiveIsComputed &&
      !hasFormula
    ) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
        data: {
          formulaComponents:
            "A computed field needs at least one formula component",
        },
      });
    }
    if (section === FieldSection.MATCH && !metricId) {
  throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
    data: { metricId: "metricId is required for MATCH section fields" },
  });
}
    if (section === FieldSection.PROFILE && metricId) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
        data: {
          metricId: "metricId is not allowed for PROFILE section fields",
        },
      });
    }
    const wasComputed = existing.isComputed;
    await validateComputedConfig(sportId, {
      isComputed: effectiveIsComputed,
      requireComponents:
        effectiveIsComputed &&
        (!wasComputed || body.formulaComponents !== undefined),
      section,
      type,
      required: nextRequired,
      metricId,
      formulaComponents,
      existingId: existing.id,
    });

    const field = await prisma.$transaction(async (tx) => {
      const data: Prisma.SportFieldUncheckedUpdateInput = {
        ...(body.name !== undefined && { name }),
        ...(body.slug !== undefined && { slug }),
        ...(body.name !== undefined &&
          body.slug === undefined && { slug: slugify(name) }),
        ...(body.section !== undefined && { section }),
        ...(body.type !== undefined && { type }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(nextRequired !== undefined && { required: nextRequired }),
        ...(body.searchable !== undefined && { searchable: body.searchable }),
        ...(body.filterable !== undefined && { filterable: body.filterable }),
        ...(body.sortable !== undefined && { sortable: body.sortable }),
        ...(body.displayOrder !== undefined && {
          displayOrder: body.displayOrder,
        }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.metricId !== undefined && { metricId: body.metricId ?? null }),
        ...(body.isComputed !== undefined && {
          isComputed: effectiveIsComputed,
        }),
        ...(body.formulaMultiplier !== undefined && {
          formulaMultiplier: body.formulaMultiplier,
        }),
      };

      await tx.sportField.update({
        where: { id: fieldId },
        data,
      });

      if (body.formulaComponents !== undefined) {
        await tx.sportFieldFormulaComponent.deleteMany({
          where: { computedFieldId: fieldId },
        });
        if (formulaComponents.length > 0) {
          await tx.sportFieldFormulaComponent.createMany({
            data: formulaComponentsData(formulaComponents).map((c) => ({
              ...c,
              computedFieldId: fieldId,
            })),
          });
        }
      }

      return tx.sportField.findUniqueOrThrow({
        where: { id: fieldId },
        include: {
          options: { orderBy: { createdAt: "asc" } },
          metric: { select: { id: true, name: true, slug: true } },
          formulaComponents: {
            include: {
              sourceField: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      });
    });

    ResponseHandler.success(res, "Field updated successfully.", { field });
  },
);

export const deleteSportField = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId, fieldId } = parseParams(fieldParamsSchema, req.params);

    const existing = await prisma.sportField.findFirst({
      where: { id: fieldId, sportId },
    });
    if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
    if (!existing.isActive)
      throw new AppError(ERROR_CODES.OPERATION_NOT_ALLOWED);

    await prisma.sportField.update({
      where: { id: fieldId },
      data: { isActive: false },
    });

    ResponseHandler.success(res, "Field deleted successfully.", {
      id: fieldId,
    });
  },
);
