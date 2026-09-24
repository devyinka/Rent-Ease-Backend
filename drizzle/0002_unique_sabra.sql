CREATE TYPE "public"."agent_fee_type" AS ENUM('FIXED', 'PERCENTAGE');--> statement-breakpoint
CREATE TYPE "public"."agent_relationship_status" AS ENUM('PENDING', 'ACTIVE', 'REVOKED');--> statement-breakpoint
CREATE TABLE "agent_properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landlord_agent_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"agent_fee_type" "agent_fee_type",
	"agent_fee_value" numeric(14, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_properties_agent_fee_non_negative" CHECK ("agent_properties"."agent_fee_value" IS NULL OR "agent_properties"."agent_fee_value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landlord_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landlord_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"status" "agent_relationship_status" DEFAULT 'PENDING' NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenancies" DROP CONSTRAINT "tenancies_amounts_non_negative";--> statement-breakpoint
ALTER TABLE "tenancies" ADD COLUMN "agent_fee_type" "agent_fee_type";--> statement-breakpoint
ALTER TABLE "tenancies" ADD COLUMN "agent_fee_amount" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_properties" ADD CONSTRAINT "agent_properties_landlord_agent_id_landlord_agents_id_fk" FOREIGN KEY ("landlord_agent_id") REFERENCES "public"."landlord_agents"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agent_properties" ADD CONSTRAINT "agent_properties_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "landlord_agents" ADD CONSTRAINT "landlord_agents_landlord_id_landlords_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlords"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "landlord_agents" ADD CONSTRAINT "landlord_agents_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_properties_landlord_agent_property_unique" ON "agent_properties" USING btree ("landlord_agent_id","property_id");--> statement-breakpoint
CREATE INDEX "agent_properties_landlord_agent_id_idx" ON "agent_properties" USING btree ("landlord_agent_id");--> statement-breakpoint
CREATE INDEX "agent_properties_property_id_idx" ON "agent_properties" USING btree ("property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agents_user_unique" ON "agents" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "landlord_agents_landlord_agent_unique" ON "landlord_agents" USING btree ("landlord_id","agent_id");--> statement-breakpoint
CREATE INDEX "landlord_agents_landlord_id_idx" ON "landlord_agents" USING btree ("landlord_id");--> statement-breakpoint
CREATE INDEX "landlord_agents_agent_id_idx" ON "landlord_agents" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "landlord_agents_status_idx" ON "landlord_agents" USING btree ("status");--> statement-breakpoint
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_amounts_non_negative" CHECK (
    "tenancies"."rent_amount" >= 0
    AND "tenancies"."deposit_amount" >= 0
    AND "tenancies"."service_charge" >= 0
    AND "tenancies"."agent_fee_amount" >= 0
  );