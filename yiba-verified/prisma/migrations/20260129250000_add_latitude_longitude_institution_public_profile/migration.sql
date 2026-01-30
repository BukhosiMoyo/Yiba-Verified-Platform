-- Add optional latitude and longitude to InstitutionPublicProfile for map and distance sort
ALTER TABLE "InstitutionPublicProfile" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "InstitutionPublicProfile" ADD COLUMN "longitude" DOUBLE PRECISION;
