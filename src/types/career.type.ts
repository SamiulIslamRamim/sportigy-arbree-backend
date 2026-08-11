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

export interface FieldStat {
  fieldId: string;
  fieldName: string;
  total: number;
}

export type ResultBreakdown = Record<MatchResult, number>;
