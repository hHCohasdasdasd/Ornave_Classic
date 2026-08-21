import { PrismaClient } from '@prisma/client';
import { CountryCode, Products } from 'plaid';
import { plaidClient } from '../utils/plaidClient';
import { encrypt, decrypt } from '../utils/encryption';

const prisma = new PrismaClient();

function notFound(message: string): Error {
  const error: any = new Error(message);
  error.statusCode = 404;
  return error;
}

const CONNECTION_SELECT = {
  id: true,
  itemId: true,
  institutionName: true,
  createdAt: true,
  updatedAt: true,
  accounts: true,
} as const;

/** Balances are encrypted at rest (see comment on BankAccount in
 * schema.prisma) — decrypt them back to numbers for API responses. Plaid
 * omits current/available balance for some account types (e.g. certain
 * credit products), so a null encrypted value must stay null, not "0". */
function decryptBalance(value: string | null): number | null {
  if (value === null) return null;
  return parseFloat(decrypt(value));
}

function decryptAccountBalances<T extends { currentBalance: string | null; availableBalance: string | null }>(
  account: T
): Omit<T, 'currentBalance' | 'availableBalance'> & { currentBalance: number | null; availableBalance: number | null } {
  return { ...account, currentBalance: decryptBalance(account.currentBalance), availableBalance: decryptBalance(account.availableBalance) };
}

function decryptConnectionBalances<T extends { accounts: { currentBalance: string | null; availableBalance: string | null }[] }>(
  connection: T
) {
  return { ...connection, accounts: connection.accounts.map(decryptAccountBalances) };
}

// European coverage — most institutions here require PSD2 Open Banking,
// which means an OAuth redirect leg (see PLAID_REDIRECT_URI and
// PlaidOAuthRedirectPage on the frontend) rather than the plain
// username/password flow US sandbox banks use.
const EU_COUNTRY_CODES = [
  CountryCode.Gb,
  CountryCode.De,
  CountryCode.Fr,
  CountryCode.Es,
  CountryCode.Nl,
  CountryCode.Ie,
  CountryCode.It,
];

export class PlaidService {
  /** Starts a Plaid Link session — the token the frontend hands to Plaid's
   * own bank-picker widget. Short-lived (expires in ~30 min), single-use. */
  static async createLinkToken(userId: string): Promise<string> {
    const redirectUri = process.env.PLAID_REDIRECT_URI || undefined;
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Ornave',
      // Identity is used later (verifyBankAccount) to confirm the linked
      // account's holder name actually matches this user, gating features
      // like automatic reservation check-in on genuine ownership rather
      // than just "some account got linked".
      products: [Products.Transactions, Products.Identity],
      country_codes: EU_COUNTRY_CODES,
      language: 'en',
      ...(redirectUri ? { redirect_uri: redirectUri } : {}),
    });
    return response.data.link_token;
  }

  /** Completes the Link flow: exchanges the one-time public token Plaid
   * handed back to the frontend for a durable access token, then pulls the
   * linked accounts once so there's something to show immediately. */
  static async exchangePublicToken(userId: string, publicToken: string) {
    const exchange = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;

    let institutionName: string | undefined;
    try {
      const itemResponse = await plaidClient.accountsGet({ access_token: accessToken });
      const institutionId = itemResponse.data.item.institution_id;
      if (institutionId) {
        const inst = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: EU_COUNTRY_CODES,
        });
        institutionName = inst.data.institution.name;
      }

      const connection = await prisma.bankConnection.create({
        data: {
          userId,
          itemId,
          accessToken: encrypt(accessToken),
          institutionName,
        },
      });

      await prisma.bankAccount.createMany({
        data: itemResponse.data.accounts.map((acc) => ({
          connectionId: connection.id,
          plaidAccountId: acc.account_id,
          name: acc.name,
          officialName: acc.official_name || undefined,
          mask: acc.mask || undefined,
          type: acc.type,
          subtype: acc.subtype || undefined,
          currentBalance: acc.balances.current != null ? encrypt(String(acc.balances.current)) : undefined,
          availableBalance: acc.balances.available != null ? encrypt(String(acc.balances.available)) : undefined,
          currency: acc.balances.iso_currency_code || undefined,
        })),
      });

      const created = await prisma.bankConnection.findUniqueOrThrow({ where: { id: connection.id }, select: CONNECTION_SELECT });
      return decryptConnectionBalances(created);
    } catch (err) {
      // Best-effort cleanup if account fetch fails after the item was
      // already exchanged — otherwise it's an orphaned, permanently-broken
      // connection the user can't see or remove.
      await prisma.bankConnection.deleteMany({ where: { itemId } }).catch(() => {});
      throw err;
    }
  }

  /** Connections plus a fresh balance snapshot pulled from Plaid — cheap
   * enough in Sandbox to just refetch on every load rather than build out
   * webhook-driven sync for what's still a personal finance overview. */
  static async listConnections(userId: string) {
    const connections = await prisma.bankConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    for (const connection of connections) {
      try {
        const accessToken = decrypt(connection.accessToken);
        const response = await plaidClient.accountsGet({ access_token: accessToken });
        for (const acc of response.data.accounts) {
          await prisma.bankAccount.updateMany({
            where: { plaidAccountId: acc.account_id },
            data: {
              currentBalance: acc.balances.current != null ? encrypt(String(acc.balances.current)) : null,
              availableBalance: acc.balances.available != null ? encrypt(String(acc.balances.available)) : null,
            },
          });
        }
      } catch (err) {
        console.error(`[Plaid] Failed to refresh balances for connection ${connection.id}:`, err);
      }
    }

    const refreshed = await prisma.bankConnection.findMany({
      where: { userId },
      select: CONNECTION_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return refreshed.map(decryptConnectionBalances);
  }

  /** Transactions from the last `days` days across every connected account,
   * newest first. */
  static async listTransactions(userId: string, days = 30) {
    const connections = await prisma.bankConnection.findMany({ where: { userId } });
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const all: any[] = [];
    for (const connection of connections) {
      try {
        const accessToken = decrypt(connection.accessToken);
        const response = await plaidClient.transactionsGet({
          access_token: accessToken,
          start_date: fmt(startDate),
          end_date: fmt(endDate),
        });
        for (const t of response.data.transactions) {
          all.push({
            id: t.transaction_id,
            accountId: t.account_id,
            institutionName: connection.institutionName,
            name: t.name,
            merchantName: t.merchant_name,
            amount: t.amount,
            currency: t.iso_currency_code,
            date: t.date,
            category: t.category?.[0],
            pending: t.pending,
          });
        }
      } catch (err) {
        console.error(`[Plaid] Failed to fetch transactions for connection ${connection.id}:`, err);
      }
    }

    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return all;
  }

  /** Normalizes to lowercase alpha-only tokens so "O'Brien-Smith, Jr." and
   * "obrien smith" compare as equal — punctuation/casing/suffix noise, not
   * substance, shouldn't be able to fail a legitimate match. */
  private static nameTokens(name: string): Set<string> {
    return new Set(
      name
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t && !['jr', 'sr', 'ii', 'iii'].includes(t))
    );
  }

  /** Real verification, not just "an account got linked" — pulls the
   * account holder name(s) Plaid's Identity product has on file for this
   * account and checks it against the user's registered name. Required
   * before a bank account can gate anything (e.g. automatic check-in). */
  static async verifyBankAccount(userId: string, accountId: string) {
    const account = await prisma.bankAccount.findFirst({
      where: { id: accountId, connection: { userId } },
      include: { connection: true },
    });
    if (!account) throw notFound('Bank account not found');

    // Prefer the legal name from CheckInProfile when the user has filled
    // one in — that's the name they explicitly confirmed for identity
    // checks, more trustworthy for this purpose than the account's
    // firstName/lastName (which could be a nickname, a typo from
    // registration, etc.).
    const [user, checkInProfile] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { firstName: true, lastName: true } }),
      prisma.checkInProfile.findUnique({ where: { userId } }),
    ]);
    const nameForMatch = checkInProfile?.legalFirstName && checkInProfile?.legalLastName
      ? `${checkInProfile.legalFirstName} ${checkInProfile.legalLastName}`
      : `${user.firstName} ${user.lastName}`;
    const userTokens = this.nameTokens(nameForMatch);

    let matched = false;
    try {
      const accessToken = decrypt(account.connection.accessToken);
      const identity = await plaidClient.identityGet({ access_token: accessToken });
      const plaidAccount = identity.data.accounts.find((a) => a.account_id === account.plaidAccountId);
      const ownerNames = plaidAccount?.owners.flatMap((o) => o.names) || [];
      matched = ownerNames.some((name) => {
        const idTokens = this.nameTokens(name);
        return [...userTokens].every((t) => idTokens.has(t));
      });
    } catch (err) {
      console.error(`[Plaid] Identity check failed for account ${accountId}:`, err);
      matched = false;
    }

    const updated = await prisma.bankAccount.update({
      where: { id: accountId },
      data: { verificationStatus: matched ? 'VERIFIED' : 'FAILED', verifiedAt: matched ? new Date() : null },
    });
    // currentBalance/availableBalance are encrypted at rest — every other
    // read path (listConnections) decrypts before returning; this one has
    // to as well, or the frontend gets raw ciphertext where it expects a
    // number.
    return decryptAccountBalances(updated);
  }

  static async removeConnection(userId: string, connectionId: string) {
    const connection = await prisma.bankConnection.findFirst({ where: { id: connectionId, userId } });
    if (!connection) throw notFound('Bank connection not found');

    try {
      const accessToken = decrypt(connection.accessToken);
      await plaidClient.itemRemove({ access_token: accessToken });
    } catch (err) {
      // Still remove our record even if Plaid's side fails (e.g. already
      // revoked by the user from their bank) — an orphaned local row that
      // no longer works is worse than a dangling Plaid item.
      console.error(`[Plaid] itemRemove failed for connection ${connectionId}:`, err);
    }

    await prisma.bankConnection.delete({ where: { id: connectionId } });
  }
}
