-- Drop the never-used-from-the-UI Invoice/Client feature (backend-complete,
-- but no frontend page ever called it — /work-suite/clients and
-- /work-suite/invoices both just redirect elsewhere).
DROP TABLE IF EXISTS "Invoice";
DROP TABLE IF EXISTS "Client";

-- Real backend for the Work Suite Focus timer, replacing its
-- localStorage-only session count and prefs.
ALTER TABLE "User" ADD COLUMN "focusWorkMinutes" INTEGER NOT NULL DEFAULT 25;
ALTER TABLE "User" ADD COLUMN "focusBreakMinutes" INTEGER NOT NULL DEFAULT 5;

CREATE TABLE "FocusSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workMinutes" INTEGER NOT NULL,
    "breakMinutes" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FocusSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FocusSession_userId_idx" ON "FocusSession"("userId");
CREATE INDEX "FocusSession_completedAt_idx" ON "FocusSession"("completedAt");

ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
