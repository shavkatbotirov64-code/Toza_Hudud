-- Vehicles jadvaliga patrol ustunlarini qo'shish

-- isPatrolling ustuni
ALTER TABLE "vehicles" 
ADD COLUMN IF NOT EXISTS "isPatrolling" BOOLEAN DEFAULT true;

-- hasCleanedOnce ustuni
ALTER TABLE "vehicles" 
ADD COLUMN IF NOT EXISTS "hasCleanedOnce" BOOLEAN DEFAULT false;

-- patrolIndex ustuni
ALTER TABLE "vehicles" 
ADD COLUMN IF NOT EXISTS "patrolIndex" INTEGER DEFAULT 0;

-- patrolRoute ustuni (JSON)
ALTER TABLE "vehicles" 
ADD COLUMN IF NOT EXISTS "patrolRoute" JSONB DEFAULT '[]'::jsonb;

-- currentRoute ustuni (JSON)
ALTER TABLE "vehicles" 
ADD COLUMN IF NOT EXISTS "currentRoute" JSONB DEFAULT '[]'::jsonb;

-- Barcha mavjud mashinalar uchun default qiymatlarni o'rnatish
UPDATE "vehicles" 
SET "isPatrolling" = true, 
    "hasCleanedOnce" = false, 
    "patrolIndex" = 0,
    "patrolRoute" = '[]'::jsonb,
    "currentRoute" = '[]'::jsonb
WHERE "isPatrolling" IS NULL;

SELECT 'Patrol columns added successfully!' as result;
