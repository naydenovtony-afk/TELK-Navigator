CREATE INDEX "cases_user_id_idx" ON "cases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cases_user_id_created_at_idx" ON "cases" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "documents_case_id_idx" ON "documents" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "documents_uploaded_at_idx" ON "documents" USING btree ("uploaded_at");