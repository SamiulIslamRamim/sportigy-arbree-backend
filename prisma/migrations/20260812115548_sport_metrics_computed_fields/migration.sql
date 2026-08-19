-- CreateEnum
CREATE TYPE "FormulaRole" AS ENUM ('NUMERATOR', 'DENOMINATOR');

-- AlterTable
ALTER TABLE "sport_fields" ADD COLUMN     "formula_multiplier" DECIMAL(6,2),
ADD COLUMN     "is_computed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metric_id" UUID;

-- CreateTable
CREATE TABLE "sport_metrics" (
    "id" UUID NOT NULL,
    "sport_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sport_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport_field_formula_components" (
    "id" UUID NOT NULL,
    "computed_field_id" UUID NOT NULL,
    "source_field_id" UUID NOT NULL,
    "role" "FormulaRole" NOT NULL,

    CONSTRAINT "sport_field_formula_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sport_metrics_sport_id_idx" ON "sport_metrics"("sport_id");

-- CreateIndex
CREATE UNIQUE INDEX "sport_metrics_sport_id_slug_key" ON "sport_metrics"("sport_id", "slug");

-- CreateIndex
CREATE INDEX "sport_field_formula_components_computed_field_id_idx" ON "sport_field_formula_components"("computed_field_id");

-- CreateIndex
CREATE UNIQUE INDEX "sport_field_formula_components_computed_field_id_source_fie_key" ON "sport_field_formula_components"("computed_field_id", "source_field_id", "role");

-- AddForeignKey
ALTER TABLE "sport_fields" ADD CONSTRAINT "sport_fields_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "sport_metrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_metrics" ADD CONSTRAINT "sport_metrics_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_field_formula_components" ADD CONSTRAINT "sport_field_formula_components_computed_field_id_fkey" FOREIGN KEY ("computed_field_id") REFERENCES "sport_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_field_formula_components" ADD CONSTRAINT "sport_field_formula_components_source_field_id_fkey" FOREIGN KEY ("source_field_id") REFERENCES "sport_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
