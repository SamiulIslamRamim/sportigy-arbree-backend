import { Prisma } from "../generated/prisma/client";
import { MatchResult } from "../generated/prisma/enums";

export type CountValue = number | string | null;
export type NumericValue = number | string | Prisma.Decimal | null;

export interface CategoryStatRow {
  categoryId: string | null;
  fieldId: string;
  fieldName: string;
  total: NumericValue;
}

export interface TeamRow {
  teamKey: string;
  teamOrgId: string | null;
  teamName: string | null;
  matchesPlayed: CountValue;
  winCount: CountValue;
  lossCount: CountValue;
  drawCount: CountValue;
  tieCount: CountValue;
  noResultCount: CountValue;
}

export interface TeamStatRow {
  teamKey: string;
  fieldId: string;
  fieldName: string;
  total: NumericValue;
}

export type ResultBreakdown = Record<MatchResult, number>;

/**
 * A sport field's stat-bearing config (raw NUMBER MATCH fields plus computed).
 * Loaded once per stats request and shared by career/by-team post-processing.
 */
export interface CareerFieldConfig {
  id: string;
  name: string;
  displayOrder: number;
  isComputed: boolean;
  metricId: string | null;
  formulaMultiplier: number | null;
  numeratorIds: string[];
  denominatorIds: string[];
}

export interface CareerMetricConfig {
  id: string;
  name: string;
  displayOrder: number;
}

export type CareerFieldOutput =
  | { fieldId: string; name: string; metricId: string | null; isComputed: false; total: number }
  | { fieldId: string; name: string; metricId: string | null; isComputed: true; value: number | null };

export interface CareerMetricOutput {
  metric: string;
  metricId: string | null;
  fields: CareerFieldOutput[];
}
