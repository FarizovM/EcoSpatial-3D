-- CreateTable
CREATE TABLE "monitoring_zones" (
    "monitoring_zone_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "color_hex" TEXT NOT NULL,
    "geom" geometry(MultiPolygon, 4326) NOT NULL,

    CONSTRAINT "monitoring_zones_pkey" PRIMARY KEY ("monitoring_zone_id")
);

-- CreateIndex
CREATE INDEX "idx_monitoring_zones_geom" ON "monitoring_zones" USING GIST ("geom");

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_zones_name_key" ON "monitoring_zones"("name");

-- CreateIndex
CREATE INDEX "idx_sensors_is_active" ON "sensors"("is_active");
