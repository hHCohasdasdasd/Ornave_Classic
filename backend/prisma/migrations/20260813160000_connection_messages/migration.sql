CREATE TABLE "ConnectionMessage" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "senderIsCompany" BOOLEAN NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConnectionMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConnectionMessage_connectionId_idx" ON "ConnectionMessage"("connectionId");

ALTER TABLE "ConnectionMessage" ADD CONSTRAINT "ConnectionMessage_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "UserCompanyConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
