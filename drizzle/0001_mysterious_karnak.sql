CREATE TYPE "public"."tenant_invitation_status" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "tenant_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landlord_id" uuid NOT NULL,
	"email" varchar(255),
	"phone" varchar(30),
	"token_hash" text NOT NULL,
	"status" "tenant_invitation_status" DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_invitations_email_or_phone_required" CHECK (
        "tenant_invitations"."email" IS NOT NULL
        OR "tenant_invitations"."phone" IS NOT NULL
      )
);
--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "tenant_invitations" ADD CONSTRAINT "tenant_invitations_landlord_id_landlords_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlords"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_invitations_token_hash_unique" ON "tenant_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "tenant_invitations_landlord_id_idx" ON "tenant_invitations" USING btree ("landlord_id");--> statement-breakpoint
CREATE INDEX "tenant_invitations_status_idx" ON "tenant_invitations" USING btree ("status");