-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateTable
CREATE TABLE "sensors" (
    "sensor_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "geom" geometry(Point, 4326) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensors_pkey" PRIMARY KEY ("sensor_id")
);

-- CreateTable
CREATE TABLE "air_quality_measurements" (
    "aqm_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sensor_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pm2_5" DECIMAL(5,2),
    "pm10" DECIMAL(5,2),
    "co2" DECIMAL(6,2),
    "temperature" DECIMAL(5,2),
    "humidity" DECIMAL(5,2),

    CONSTRAINT "air_quality_measurements_pkey" PRIMARY KEY ("aqm_id")
);

-- CreateIndex
CREATE INDEX "idx_sensors_geom" ON "sensors" USING GIST ("geom");

-- CreateIndex
CREATE INDEX "idx_measurements_sensor_time" ON "air_quality_measurements"("sensor_id", "created_at");

-- AddForeignKey
ALTER TABLE "air_quality_measurements" ADD CONSTRAINT "air_quality_measurements_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("sensor_id") ON DELETE RESTRICT ON UPDATE CASCADE;
