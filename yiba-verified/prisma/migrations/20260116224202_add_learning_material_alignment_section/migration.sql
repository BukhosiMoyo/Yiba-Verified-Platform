-- AlterTable
ALTER TABLE "Readiness" ADD COLUMN     "curriculum_alignment_confirmed" BOOLEAN,
ADD COLUMN     "knowledge_module_coverage" INTEGER,
ADD COLUMN     "learning_material_exists" BOOLEAN,
ADD COLUMN     "practical_module_coverage" INTEGER;
