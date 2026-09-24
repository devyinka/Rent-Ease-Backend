CREATE TYPE "public"."agent_compensation_frequency" AS ENUM('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'BI_ANNUAL', 'ANNUAL', 'PER_COLLECTION');--> statement-breakpoint
CREATE TYPE "public"."agent_compensation_type" AS ENUM('FIXED', 'PERCENTAGE');--> statement-breakpoint
CREATE TYPE "public"."agent_permission" AS ENUM('VIEW_PROPERTY', 'MANAGE_PROPERTY', 'VIEW_UNITS', 'MANAGE_UNITS', 'VIEW_TENANTS', 'MANAGE_TENANTS', 'VIEW_FINANCIALS', 'COLLECT_RENT', 'MANAGE_MAINTENANCE', 'MANAGE_DOCUMENTS', 'SEND_REMINDERS', 'VIEW_REPORTS');--> statement-breakpoint
CREATE TABLE "agent_compensations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_property_id" uuid NOT NULL,
	"type" "agent_compensation_type" NOT NULL,
	"value" numeric(14, 2) NOT NULL,
	"frequency" "agent_compensation_frequency" DEFAULT 'MONTHLY' NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_compensations_value_non_negative" CHECK ("agent_compensations"."value" >= 0),
	CONSTRAINT "agent_compensations_valid_dates" CHECK ("agent_compensations"."effective_to" IS NULL OR "agent_compensations"."effective_to" >= "agent_compensations"."effective_from")
);
--> statement-breakpoint
CREATE TABLE "agent_property_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_property_id" uuid NOT NULL,
	"permission" "agent_permission" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_properties" RENAME COLUMN "agent_fee_type" TO "letting_fee_type";--> statement-breakpoint
ALTER TABLE "agent_properties" RENAME COLUMN "agent_fee_value" TO "letting_fee_value";--> statement-breakpoint
ALTER TABLE "tenancies" RENAME COLUMN "agent_fee_amount" TO "letting_fee_type";--> statement-breakpoint
ALTER TABLE "tenancies" RENAME COLUMN "agent_fee_type" TO "letting_fee_amount";--> statement-breakpoint
ALTER TABLE "agent_properties" DROP CONSTRAINT "agent_properties_agent_fee_non_negative";--> statement-breakpoint
ALTER TABLE "tenancies" DROP CONSTRAINT "tenancies_amounts_non_negative";--> statement-breakpoint
ALTER TABLE "agent_compensations" ADD CONSTRAINT "agent_compensations_agent_property_id_agent_properties_id_fk" FOREIGN KEY ("agent_property_id") REFERENCES "public"."agent_properties"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agent_property_permissions" ADD CONSTRAINT "agent_property_permissions_agent_property_id_agent_properties_id_fk" FOREIGN KEY ("agent_property_id") REFERENCES "public"."agent_properties"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "agent_compensations_agent_property_id_idx" ON "agent_compensations" USING btree ("agent_property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_property_permissions_unique" ON "agent_property_permissions" USING btree ("agent_property_id","permission");--> statement-breakpoint
CREATE INDEX "agent_property_permissions_agent_property_id_idx" ON "agent_property_permissions" USING btree ("agent_property_id");--> statement-breakpoint
ALTER TABLE "agent_properties" ADD CONSTRAINT "agent_properties_letting_fee_non_negative" CHECK ("agent_properties"."letting_fee_value" IS NULL OR "agent_properties"."letting_fee_value" >= 0);--> statement-breakpoint
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_amounts_non_negative" CHECK (
    "tenancies"."rent_amount" >= 0
    AND "tenancies"."deposit_amount" >= 0
    AND "tenancies"."service_charge" >= 0
    AND "tenancies"."letting_fee_amount" >= 0
  );