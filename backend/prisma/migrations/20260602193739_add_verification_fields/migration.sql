-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Complaint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "complaint_type_id" TEXT NOT NULL,
    "address_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'moderate',
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "assigned_department" TEXT,
    "case_number" TEXT NOT NULL,
    "public_tracking_url" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "dept_notified_at" DATETIME,
    "reps_notified_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "resolved_at" DATETIME,
    "verification_deadline" DATETIME,
    "dispute_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Complaint_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Complaint_complaint_type_id_fkey" FOREIGN KEY ("complaint_type_id") REFERENCES "ComplaintType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Complaint_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "Address" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Complaint" ("address_id", "assigned_department", "case_number", "complaint_type_id", "created_at", "dept_notified_at", "description", "id", "is_public", "public_tracking_url", "reps_notified_at", "resolved_at", "severity", "status", "title", "updated_at", "user_id") SELECT "address_id", "assigned_department", "case_number", "complaint_type_id", "created_at", "dept_notified_at", "description", "id", "is_public", "public_tracking_url", "reps_notified_at", "resolved_at", "severity", "status", "title", "updated_at", "user_id" FROM "Complaint";
DROP TABLE "Complaint";
ALTER TABLE "new_Complaint" RENAME TO "Complaint";
CREATE UNIQUE INDEX "Complaint_case_number_key" ON "Complaint"("case_number");
CREATE INDEX "Complaint_user_id_idx" ON "Complaint"("user_id");
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");
CREATE INDEX "Complaint_case_number_idx" ON "Complaint"("case_number");
CREATE INDEX "Complaint_address_id_idx" ON "Complaint"("address_id");
CREATE INDEX "Complaint_created_at_idx" ON "Complaint"("created_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
