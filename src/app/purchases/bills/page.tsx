"use client";

import { formatBDT } from "@/lib/utils";
import { CreditCard, Plus } from "lucide-react";

export default function BillsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bills & Vendor Expenses</h1>
          <p className="text-xs text-slate-500">Record vendor bills and expenses in Bangladeshi Taka</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition">
          <Plus className="h-4 w-4" />
          <span>New Bill</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800">Vendor Bills Ledger</h2>
          <span className="text-xs text-slate-400">Double-entry debit: Expenses (6000), credit: Accounts Payable (2000)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 uppercase font-semibold text-[10px] text-slate-500">
              <tr>
                <th className="py-2.5 px-3">Bill #</th>
                <th className="py-2.5 px-3">Vendor</th>
                <th className="py-2.5 px-3">Bill Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Amount (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 font-mono font-bold text-amber-600">BIL-2026-0001</td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">Karim Stationers & Supplies</td>
                <td className="py-2.5 px-3 text-slate-500">01/08/2026</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                    RECEIVED
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatBDT(8500)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
