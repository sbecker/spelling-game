CREATE TABLE "game_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"daily_streak" integer DEFAULT 0 NOT NULL,
	"last_played_at" timestamp,
	"earned_badges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "game_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "game_profiles" ADD CONSTRAINT "game_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;