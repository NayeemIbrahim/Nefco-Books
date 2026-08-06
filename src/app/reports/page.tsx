"use client";

import { formatBDT } from "@/lib/utils";
import { BarChart3, PieChart, Scale, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial Reports</h1>
        <p className="text-xs text-slate-500">Comprehensive P&L, Balance Sheet, and Trial Balance reports in BDT</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4 hover:border-blue-300 transition">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-md w-fit">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Profit & Loss Statement</h2>
            <p className="text-xs text-slate-500 mt-1">Summary of Revenues (4000) minus Cost of Goods Sold & Expenses (5000/6000).</p>
          </div>
          <div className="pt-2 text-xs font-bold text-blue-600 flex items-center gap-1">
            <span>View Statement (Phase 4)</span> <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4 hover:border-emerald-300 transition">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-md w-fit">
            <PieChart className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Balance Sheet</h2>
            <p className="text-xs text-slate-500 mt-1">Assets = Liabilities + Owner's Equity ledger balances snapshot in BDT.</p>
          </div>
          <div className="pt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>View Statement (Phase 4)</span> <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4 hover:border-purple-300 transition">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-md w-fit">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Trial Balance</h2>
            <p className="text-xs text-slate-500 mt-1">Validation report ensuring total debits equal total credits across all accounts.</p>
          </div>
          <div className="pt-2 text-xs font-bold text-purple-600 flex items-center gap-1">
            <span>View Report (Phase 4)</span> <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
