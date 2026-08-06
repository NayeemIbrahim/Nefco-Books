import { prisma } from "./prisma";

export interface JournalLineInput {
  accountCode: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface CreateJournalEntryParams {
  entryNumber: string;
  date?: Date;
  reference?: string;
  description?: string;
  sourceDocumentType?: "INVOICE" | "BILL" | "PAYMENT" | "MANUAL";
  sourceDocumentId?: string;
  lines: JournalLineInput[];
}

/**
 * Creates a balanced Journal Entry and updates current running balances on affected Accounts
 */
export async function createBalancedJournalEntry(params: CreateJournalEntryParams) {
  // 1. Verify balanced entry (sum Debit == sum Credit)
  const totalDebit = params.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = params.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error(
      `Double-Entry violation: Total Debit (৳ ${totalDebit}) does not equal Total Credit (৳ ${totalCredit}).`
    );
  }

  return await prisma.$transaction(async (tx) => {
    // 2. Resolve account IDs from account codes
    const lineCreations = [];

    for (const line of params.lines) {
      const account = await tx.account.findUnique({
        where: { code: line.accountCode },
      });

      if (!account) {
        throw new Error(`Account code '${line.accountCode}' not found in Chart of Accounts.`);
      }

      // Update running account balance
      // Asset/Expense: Net Increase = Debit - Credit
      // Liability/Equity/Revenue: Net Increase = Credit - Debit
      let balanceChange = 0;
      if (account.type === "ASSET" || account.type === "EXPENSE") {
        balanceChange = line.debit - line.credit;
      } else {
        balanceChange = line.credit - line.debit;
      }

      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });

      lineCreations.push({
        accountId: account.id,
        debit: line.debit,
        credit: line.credit,
        description: line.description || params.description,
      });
    }

    // 3. Create the Journal Entry record with lines
    const journalEntry = await tx.journalEntry.create({
      data: {
        entryNumber: params.entryNumber,
        date: params.date || new Date(),
        reference: params.reference,
        description: params.description,
        sourceDocumentType: params.sourceDocumentType,
        sourceDocumentId: params.sourceDocumentId,
        status: "POSTED",
        lines: {
          create: lineCreations,
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    return journalEntry;
  });
}
