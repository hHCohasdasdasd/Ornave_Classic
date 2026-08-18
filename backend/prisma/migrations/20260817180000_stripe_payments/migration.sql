-- User: Stripe Customer reference
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- SavedCard: back it with a real Stripe PaymentMethod instead of derived digits
ALTER TABLE "SavedCard" ADD COLUMN "stripePaymentMethodId" TEXT NOT NULL;
CREATE UNIQUE INDEX "SavedCard_stripePaymentMethodId_key" ON "SavedCard"("stripePaymentMethodId");

-- SavedBankAccount: ACH payment methods linked via Stripe Financial Connections
CREATE TABLE "SavedBankAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripePaymentMethodId" TEXT NOT NULL,
    "bankName" TEXT,
    "accountType" TEXT,
    "last4" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedBankAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SavedBankAccount_stripePaymentMethodId_key" ON "SavedBankAccount"("stripePaymentMethodId");
CREATE INDEX "SavedBankAccount_userId_idx" ON "SavedBankAccount"("userId");

ALTER TABLE "SavedBankAccount" ADD CONSTRAINT "SavedBankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Order: real charge-capture state, separate from fulfillment `status`
ALTER TABLE "Order" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Order" ADD COLUMN "stripePaymentIntentId" TEXT;
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");
