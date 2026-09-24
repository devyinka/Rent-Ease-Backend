CREATE TYPE "public"."agent_invitation_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "agent_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landlord_id" uuid NOT NULL,
	"email" varchar(255),
	"phone" varchar(30),
	"token_hash" text NOT NULL,
	"status" "agent_invitation_status" DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"declined_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_invitations_email_or_phone_required" CHECK (
        "agent_invitations"."email" IS NOT NULL
        OR "agent_invitations"."phone" IS NOT NULL
      )
);
--> statement-breakpoint
ALTER TABLE "landlord_agents" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "landlord_agents" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::text;--> statement-breakpoint
DROP TYPE "public"."agent_relationship_status";--> statement-breakpoint
CREATE TYPE "public"."agent_relationship_status" AS ENUM('ACTIVE', 'REVOKED');--> statement-breakpoint
ALTER TABLE "landlord_agents" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"public"."agent_relationship_status";--> statement-breakpoint
ALTER TABLE "landlord_agents" ALTER COLUMN "status" SET DATA TYPE "public"."agent_relationship_status" USING "status"::"public"."agent_relationship_status";--> statement-breakpoint
ALTER TABLE "agent_invitations" ADD CONSTRAINT "agent_invitations_landlord_id_landlords_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlords"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_invitations_token_hash_unique" ON "agent_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "agent_invitations_landlord_id_idx" ON "agent_invitations" USING btree ("landlord_id");--> statement-breakpoint
CREATE INDEX "agent_invitations_status_idx" ON "agent_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_invitations_email_idx" ON "agent_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "agent_invitations_phone_idx" ON "agent_invitations" USING btree ("phone");--> statement-breakpoint
ALTER TABLE "landlord_agents" DROP COLUMN "invited_at";