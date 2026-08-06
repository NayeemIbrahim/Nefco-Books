import { PrismaClient, AccountType, AccountSubType } from "@prisma/client";

const prisma = new PrismaClient();

const defaultAccounts = [
  // ASSETS
  { code: "1000", name: "Petty Cash", type: AccountType.ASSET, subType: AccountSubType.CASH_AND_BANK, isSystem: true },
  { code: "1010", name: "Main Bank Account (BDT)", type: AccountType.ASSET, subType: AccountSubType.CASH_AND_BANK, isSystem: true },
  { code: "1020", name: "bKash / Nagad Mobile Banking", type: AccountType.ASSET, subType: AccountSubType.CASH_AND_BANK, isSystem: true },
  { code: "1100", name: "Accounts Receivable", type: AccountType.ASSET, subType: AccountSubType.ACCOUNTS_RECEIVABLE, isSystem: true },
  { code: "1200", name: "Inventory Asset", type: AccountType.ASSET, subType: AccountSubType.OTHER_CURRENT_ASSET, isSystem: true },

  // LIABILITIES
  { code: "2000", name: "Accounts Payable", type: AccountType.LIABILITY, subType: AccountSubType.ACCOUNTS_PAYABLE, isSystem: true },
  { code: "2100", name: "VAT / Tax Payable", type: AccountType.LIABILITY, subType: AccountSubType.OTHER_CURRENT_LIABILITY, isSystem: true },

  // EQUITY
  { code: "3000", name: "Owner's Equity", type: AccountType.EQUITY, subType: AccountSubType.EQUITY, isSystem: true },
  { code: "3100", name: "Retained Earnings", type: AccountType.EQUITY, subType: AccountSubType.EQUITY, isSystem: true },

  // REVENUE
  { code: "4000", name: "Sales Revenue", type: AccountType.REVENUE, subType: AccountSubType.OPERATING_REVENUE, isSystem: true },
  { code: "4100", name: "Service Revenue", type: AccountType.REVENUE, subType: AccountSubType.OPERATING_REVENUE, isSystem: true },
  { code: "4900", name: "Other Income", type: AccountType.REVENUE, subType: AccountSubType.OTHER_REVENUE, isSystem: false },

  // EXPENSES
  { code: "5000", name: "Cost of Goods Sold (COGS)", type: AccountType.EXPENSE, subType: AccountSubType.COST_OF_GOODS_SOLD, isSystem: true },
  { code: "6000", name: "General Operating Expense", type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, isSystem: true },
  { code: "6010", name: "Office Rent Expense", type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, isSystem: false },
  { code: "6020", name: "Utilities Expense (Electricity/Internet)", type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, isSystem: false },
  { code: "6030", name: "Salaries & Wages Expense", type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, isSystem: false },
];

async function main() {
  console.log("Seeding default Chart of Accounts for BDT Cloud Accounting...");

  for (const acc of defaultAccounts) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: {},
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        subType: acc.subType,
        isSystem: acc.isSystem,
        balance: 0.0,
      },
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
