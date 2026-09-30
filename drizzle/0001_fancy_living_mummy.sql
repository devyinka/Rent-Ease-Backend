CREATE TYPE "public"."agent_property_status" AS ENUM('ACTIVE', 'REVOKED');--> statement-breakpoint
DROP INDEX "agent_properties_landlord_agent_property_unique";--> statement-breakpoint
ALTER TABLE "agent_properties" ADD COLUMN "status" "agent_property_status" DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_properties_landlord_agent_property_unique" ON "agent_properties" USING btree ("landlord_agent_id","property_id") WHERE "agent_properties"."status" = 'ACTIVE';