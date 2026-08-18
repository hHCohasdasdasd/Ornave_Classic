-- Converts balance columns from plaintext Float to encrypted-string storage.
-- Existing plaintext balances are cleared rather than migrated in place —
-- they were already exposed in the table, and every connection refreshes
-- its balances automatically the next time listConnections() runs (which
-- happens on every Finance page load), re-populating them encrypted.
ALTER TABLE "BankAccount" ALTER COLUMN "currentBalance" TYPE TEXT USING NULL;
ALTER TABLE "BankAccount" ALTER COLUMN "availableBalance" TYPE TEXT USING NULL;
