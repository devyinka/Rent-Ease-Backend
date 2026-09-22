CREATE TYPE "public"."auth_session_status" AS ENUM('ACTIVE', 'REVOKED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."rent_frequency" AS ENUM('MONTHLY', 'QUARTERLY', 'BI_ANNUAL', 'ANNUAL', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."tenancy_status" AS ENUM('PENDING', 'ACTIVE', 'ENDED', 'TERMINATED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."unit_type" AS ENUM('FLAT', 'APARTMENT', 'DUPLEX', 'ROOM', 'SHOP', 'OFFICE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('LANDLORD', 'AGENT', 'TENANT', 'TECHNICIAN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INVITED', 'SUSPENDED', 'DEACTIVATED');--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"status" "auth_session_status" DEFAULT 'ACTIVE' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landlords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landlord_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"country" varchar(100) DEFAULT 'Nigeria' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "properties_name_not_empty" CHECK (length(trim("properties"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "tenancies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"status" "tenancy_status" DEFAULT 'PENDING' NOT NULL,
	"rent_amount" numeric(14, 2) NOT NULL,
	"rent_frequency" "rent_frequency" NOT NULL,
	"deposit_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"service_charge" numeric(14, 2) DEFAULT '0' NOT NULL,
	"move_out_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenancies_valid_dates" CHECK (
        "tenancies"."end_date" IS NULL
        OR "tenancies"."end_date" >= "tenancies"."start_date"
      ),
	CONSTRAINT "tenancies_amounts_non_negative" CHECK (
        "tenancies"."rent_amount" >= 0
        AND "tenancies"."deposit_amount" >= 0
        AND "tenancies"."service_charge" >= 0
      )
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"unit_number" varchar(50) NOT NULL,
	"unit_type" "unit_type" NOT NULL,
	"floor" integer,
	"bedrooms" smallint DEFAULT 0 NOT NULL,
	"bathrooms" smallint DEFAULT 0 NOT NULL,
	"rent_amount" numeric(14, 2) NOT NULL,
	"rent_frequency" "rent_frequency" NOT NULL,
	"service_charge" numeric(14, 2) DEFAULT '0' NOT NULL,
	"deposit_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "units_unit_number_not_empty" CHECK (length(trim("units"."unit_number")) > 0),
	CONSTRAINT "units_bedrooms_non_negative" CHECK ("units"."bedrooms" >= 0),
	CONSTRAINT "units_bathrooms_non_negative" CHECK ("units"."bathrooms" >= 0),
	CONSTRAINT "units_amounts_non_negative" CHECK (
        "units"."rent_amount" >= 0
        AND "units"."service_charge" >= 0
        AND "units"."deposit_amount" >= 0
      )
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"phone" varchar(30),
	"password_hash" text,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"role" "user_role" NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_or_phone_required" CHECK ("users"."email" IS NOT NULL OR "users"."phone" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "landlords" ADD CONSTRAINT "landlords_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_landlord_id_landlords_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlords"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_refresh_token_hash_unique" ON "auth_sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "landlords_user_unique" ON "landlords" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenancies_one_active_per_unit" ON "tenancies" USING btree ("unit_id") WHERE "tenancies"."status" = 'ACTIVE';--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_user_unique" ON "tenants" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "units_property_unit_unique" ON "units" USING btree ("property_id","unit_number");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique" ON "users" USING btree ("phone");