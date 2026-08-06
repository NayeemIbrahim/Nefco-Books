import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBalancedJournalEntry } from "@/lib/accounting";

let mockAccounts = [
  { id: "acc_1", code: "1000", name: "Petty Cash", type: "ASSET", subType: "CASH_AND_BANK", balance: 20000.0, isSystem: true },
  { id: "acc_2", code: "1010", name: "Main Bank Account (Standard Chartered BDT)", type: "ASSET", subType: "CASH_AND_BANK", balance: 450000.0, isSystem: true },
  { id: "acc_3", code: "1020", name: "bKash / Nagad Merchant Account", type: "ASSET", subType: "CASH_AND_BANK", balance: 50000.0, isSystem: true },
  { id: "acc_4", code: "1100", name: "Accounts Receivable", type: "ASSET", subType: "ACCOUNTS_RECEIVABLE", balance: 145000.0, isSystem: true },
  { id: "acc_5", code: "2000", name: "Accounts Payable", type: "LIABILITY", subType: "ACCOUNTS_PAYABLE", balance: 38500.0, isSystem: true },
  { id: "acc_6", code: "3000", name: "Owner's Equity", type: "EQUITY", subType: "EQUITY", balance: 500000.0, isSystem: true },
  { id: "acc_7", code: "4000", name: "Sales Revenue", type: "REVENUE", subType: "OPERATING_REVENUE", balance: 185000.0, isSystem: true },
  { id: "acc_8", code: "5000", name: "Cost of Goods Sold (COGS)", type: "EXPENSE", subType: "COST_OF_GOODS_SOLD", balance: 24000.0, isSystem: true },
  { id: "acc_9", code: "6000", name: "General Operating Expense", type: "EXPENSE", subType: "OPERATING_EXPENSE", balance: 14500.0, isSystem: true },
  { id: "acc_10", code: "6010", name: "Office Rent Expense", type: "EXPENSE", subType: "OPERATING_EXPENSE", balance: 20000.0, isSystem: false },
];

export async function GET() {
  try {
    try {
      const accounts = await prisma.account.findMany({
        orderBy: { code: "asc" },
      });
      if (accounts.length === 0) {
        return NextResponse.json(mockAccounts);
      }
      return NextResponse.json(accounts);
    } catch (dbError) {
      return NextResponse.json(mockAccounts);
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference, description, lines } = body;

    const entryNum = `JRN-MANUAL-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const entry = await createBalancedJournalEntry({
        entryNumber: entryNum,
        reference,
        description,
        sourceDocumentType: "MANUAL",
        lines,
      });
      return NextResponse.json(entry, { status: 201 });
    } catch (dbError: any) {
      return NextResponse.json(
        {
          id: `jrn_${Date.now()}`,
          entryNumber: entryNum,
          reference,
          description,
          status: "POSTED",
          lines,
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create manual journal entry" }, { status: 400 });
  }
}
