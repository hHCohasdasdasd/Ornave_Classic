CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderIsCompany" BOOLEAN NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Ticket_connectionId_idx" ON "Ticket"("connectionId");
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");
CREATE INDEX "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "UserCompanyConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
