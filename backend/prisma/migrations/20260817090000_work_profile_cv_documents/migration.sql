ALTER TABLE "UserFile" ADD COLUMN "category" TEXT;

CREATE TABLE "WorkProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "summary" TEXT,
    "experience" TEXT NOT NULL DEFAULT '[]',
    "education" TEXT NOT NULL DEFAULT '[]',
    "skills" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkProfile_userId_key" ON "WorkProfile"("userId");

ALTER TABLE "WorkProfile" ADD CONSTRAINT "WorkProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
