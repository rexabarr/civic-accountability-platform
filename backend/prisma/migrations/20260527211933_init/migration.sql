-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "user_type" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verify_token" TEXT,
    "verify_token_expires" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "street_address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "city_council_district" INTEGER,
    "state_house_district" INTEGER,
    "state_senate_district" INTEGER,
    "police_district" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ElectedOfficial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "district" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "email" TEXT,
    "office_phone" TEXT,
    "office_address" TEXT,
    "website" TEXT,
    "party" TEXT,
    "contact_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_contact_person" TEXT,
    "verified_contact_email" TEXT,
    "verified_contact_phone" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ComplaintType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "icon_emoji" TEXT,
    "primary_department" TEXT NOT NULL,
    "department_email" TEXT,
    "department_phone" TEXT,
    "avg_resolution_days" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Complaint" (
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
    CONSTRAINT "Complaint_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Complaint_complaint_type_id_fkey" FOREIGN KEY ("complaint_type_id") REFERENCES "ComplaintType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Complaint_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "Address" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplaintUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "complaint_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "update_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "proof_image_url" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplaintUpdate_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "Complaint" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplaintUpdate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "official_id" TEXT,
    "department_name" TEXT,
    "role" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "verification_token_expires" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StaffAccount_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "ElectedOfficial" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_user_type_idx" ON "User"("user_type");

-- CreateIndex
CREATE INDEX "Address_city_state_idx" ON "Address"("city", "state");

-- CreateIndex
CREATE INDEX "Address_city_council_district_idx" ON "Address"("city_council_district");

-- CreateIndex
CREATE UNIQUE INDEX "Address_street_address_city_state_zip_code_key" ON "Address"("street_address", "city", "state", "zip_code");

-- CreateIndex
CREATE INDEX "ElectedOfficial_title_district_city_state_idx" ON "ElectedOfficial"("title", "district", "city", "state");

-- CreateIndex
CREATE INDEX "ElectedOfficial_contact_verified_idx" ON "ElectedOfficial"("contact_verified");

-- CreateIndex
CREATE UNIQUE INDEX "ComplaintType_name_key" ON "ComplaintType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_case_number_key" ON "Complaint"("case_number");

-- CreateIndex
CREATE INDEX "Complaint_user_id_idx" ON "Complaint"("user_id");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_case_number_idx" ON "Complaint"("case_number");

-- CreateIndex
CREATE INDEX "Complaint_address_id_idx" ON "Complaint"("address_id");

-- CreateIndex
CREATE INDEX "Complaint_created_at_idx" ON "Complaint"("created_at");

-- CreateIndex
CREATE INDEX "ComplaintUpdate_complaint_id_idx" ON "ComplaintUpdate"("complaint_id");

-- CreateIndex
CREATE INDEX "ComplaintUpdate_user_id_idx" ON "ComplaintUpdate"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAccount_user_id_key" ON "StaffAccount"("user_id");
