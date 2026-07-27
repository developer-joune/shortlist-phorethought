-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT,
    "profile" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "posting" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackingId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "jobTitleSnapshot" TEXT NOT NULL,
    "companySnapshot" TEXT NOT NULL,
    "applyLinkSnapshot" TEXT NOT NULL,
    "totalScore" REAL,
    "band" TEXT NOT NULL,
    "passReason" TEXT,
    "rejectReason" TEXT,
    "status" TEXT NOT NULL,
    "statusHistory" TEXT NOT NULL,
    "fullResult" TEXT NOT NULL,
    "resumeVersionUsed" TEXT,
    "dateApplied" DATETIME,
    "portalAccount" TEXT,
    "screeningAnswersUsed" TEXT,
    "operatorNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Application_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientId_key" ON "Client"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_jobId_key" ON "JobPosting"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_trackingId_key" ON "Application"("trackingId");

-- CreateIndex
CREATE INDEX "Application_band_idx" ON "Application"("band");

-- CreateIndex
CREATE INDEX "Application_clientId_idx" ON "Application"("clientId");
