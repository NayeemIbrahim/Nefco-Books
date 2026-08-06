"use client";

import { formatBDT } from "@/lib/utils";
import { Landmark, Plus, BookOpen, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function BankingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Banking & Chart of Accounts</h1>
          <p className="text-xs text-slate-500">Manage BDT bank accounts, mobile banking, and manual journal entries</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition">
          <Plus className="h-4 w-4" />
          <span>New Manual Journal</span>
        </button>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-medium text-slate-500 uppercase">1000 - Petty Cash</div>
          <div className="text-xl font-bold text-slate-900">{formatBDT(20000)}</div>
          <div className="text-[11px] text-slate-400">Cash on hand (BDT)</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-medium text-slate-500 uppercase">1010 - Main Bank Account</div>
          <div className="text-xl font-bold text-slate-900">{formatBDT(450000)}</div>
          <div className="text-[11px] text-slate-400">Standard Chartered BDT</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-medium text-slate-500 uppercase">1020 - bKash / Nagad Merchant</div>
          <div className="text-xl font-bold text-slate-900">{formatBDT(50000)}</div>
          <div className="text-[11px] text-slate-400">Mobile Financial Service</div>
        </div>
      </div>
    </div>
  );
}
