CREATE TABLE "professors" (
	"id" text PRIMARY KEY NOT NULL,
	"university" text NOT NULL,
	"country" text,
	"city" text,
	"university_rank" integer,
	"university_website" text,
	"faculty_directory" text,
	"name" text NOT NULL,
	"title" text,
	"email" text,
	"email_status" text,
	"department" text,
	"research_fields" jsonb DEFAULT '[]'::jsonb,
	"profile_url" text,
	"added_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "professors" ADD CONSTRAINT "professors_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "professors_university_idx" ON "professors" USING btree ("university");--> statement-breakpoint
CREATE INDEX "professors_name_idx" ON "professors" USING btree ("name");