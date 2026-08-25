import z from "zod";
import { FieldSection, FieldType, FormulaRole } from "../generated/prisma/enums.js";

export const sportParamsSchema = z.object({
  sportId: z.uuid("Invalid sport id"),
});

export const categoryParamsSchema = z.object({
  sportId: z.uuid("Invalid sport id"),
  categoryId: z.uuid("Invalid category id"),
});

export const fieldParamsSchema = z.object({
  sportId: z.uuid("Invalid sport id"),
  fieldId: z.uuid("Invalid field id"),
});

export const fieldIdParamSchema = z.object({
  fieldId: z.uuid("Invalid field id"),
});

export const optionParamsSchema = z.object({
  fieldId: z.uuid("Invalid field id"),
  optionId: z.uuid("Invalid option id"),
});

export const metricParamsSchema = z.object({
  sportId: z.uuid("Invalid sport id"),
  metricId: z.uuid("Invalid metric id"),
});

export const metricIdParamSchema = z.object({
  metricId: z.uuid("Invalid metric id"),
});

export const fieldSectionQuerySchema = z.nativeEnum(FieldSection, { error: "Invalid section" });

// ─── Sport ───────────────────────────────────────────────────────────────────
export const createSportSchema = z.object({
  name: z.string().trim().min(1, "Sport name is required").max(100, "Sport name is too long"),
  slug: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateSportSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

// ─── SportCategory ───────────────────────────────────────────────────────────
export const createSportCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100, "Category name is too long"),
  slug: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateSportCategorySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

// ─── SportField ──────────────────────────────────────────────────────────────
export const formulaComponentSchema = z.object({
  sourceFieldId: z.uuid("Invalid source field id"),
  role: z.nativeEnum(FormulaRole, { error: "Formula role must be NUMERATOR or DENOMINATOR" }),
});

export const formulaComponentsSchema = z.array(formulaComponentSchema).max(50, "Too many formula components");

export const createSportFieldSchema = z.object({
  name: z.string().trim().min(1, "Field name is required").max(100, "Field name is too long"),
  slug: z.string().trim().min(1).max(120).optional(),
  section: z.nativeEnum(FieldSection, { error: "Section is required and must be PROFILE or MATCH" }),
  type: z.nativeEnum(FieldType, { error: "Field type is required" }),
  description: z.string().trim().max(1000).optional().nullable(),
  required: z.boolean().optional(),
  searchable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  sortable: z.boolean().optional(),
  displayOrder: z.number().int().min(0).max(10000).optional(),
  isActive: z.boolean().optional(),
  metricId: z.uuid("Invalid metric id").optional().nullable(),
  isComputed: z.boolean().optional(),
  formulaMultiplier: z.number().optional(),
  formulaComponents: formulaComponentsSchema.optional(),
  options: z.array(
    z.object({
      label: z.string().trim().min(1, "Option label is required").max(100, "Option label is too long"),
      value: z.string().trim().min(1).max(120).optional(),
      isDefault: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }),
  ).max(50).optional(),
});

export const updateSportFieldSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: z.string().trim().min(1).max(120).optional(),
  section: z.nativeEnum(FieldSection, { error: "Section must be PROFILE or MATCH" }).optional(),
  type: z.nativeEnum(FieldType, { error: "Invalid field type" }).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  required: z.boolean().optional(),
  searchable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  sortable: z.boolean().optional(),
  displayOrder: z.number().int().min(0).max(10000).optional(),
  isActive: z.boolean().optional(),
  metricId: z.uuid("Invalid metric id").optional().nullable(),
  isComputed: z.boolean().optional(),
  formulaMultiplier: z.number().optional(),
  formulaComponents: formulaComponentsSchema.optional(),
});

// ─── SportFieldOption ────────────────────────────────────────────────────────
export const createSportFieldOptionSchema = z.object({
  label: z.string().trim().min(1, "Option label is required").max(100, "Option label is too long"),
  value: z.string().trim().min(1).max(120).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateSportFieldOptionSchema = z.object({
  label: z.string().trim().min(1).max(100).optional(),
  value: z.string().trim().min(1).max(120).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// ─── SportMetric ──────────────────────────────────────────────────────────────
export const createSportMetricSchema = z.object({
  name: z.string().trim().min(1, "Metric name is required").max(100, "Metric name is too long"),
  slug: z.string().trim().min(1).max(120).optional(),
  displayOrder: z.number().int().min(0).max(10000).optional(),
  isActive: z.boolean().optional(),
});

export const updateSportMetricSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: z.string().trim().min(1).max(120).optional(),
  displayOrder: z.number().int().min(0).max(10000).optional(),
  isActive: z.boolean().optional(),
});