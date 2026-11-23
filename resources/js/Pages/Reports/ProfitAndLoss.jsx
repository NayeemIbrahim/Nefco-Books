import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";

export default function ProfitAndLoss({
  revenues = [],
  cogs = [],
  expenses = [],
  totalRevenue = 0,
  grossProfit = 0,
  totalExpense = 0,
  netProfit = 0,
  filters = {},
}) {
  const allExpenses = [...(cogs || []), ...(expenses || [])];
  const totalAllExpenses = (parseFloat(totalExpense) || 0) + (parseFloat(cogs?.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0)) || 0);

  return (
    <ReportLayout title="Profit and Loss Statement" filters={filters}>
      <div className="space-y-6">
        {/* Operating Revenue */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg font-bold text-xs text-slate-800 uppercase tracking-wider">
            <span>Operating Revenue (4000 Series)</span>
            <span>BDT Amount</span>
          </div>

          <div className="space-y-1 px-3 text-xs">
            {revenues.length === 0 ? (
              <div className="text-slate-400 py-2 italic text-center">No operating revenue entries for this period.</div>
            ) : (
              revenues.map((acc) => (
                <div key={acc.id} className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-700 font-medium">
                    <span className="font-mono text-blue-600 mr-2">{acc.code}</span>
                    {acc.name}
                  </span>
                  <span className="font-semibold text-slate-900 font-mono">{formatBDT(acc.balance)}</span>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs font-bold text-blue-900">
            <span>TOTAL OPERATING REVENUE</span>
            <span className="font-mono">{formatBDT(totalRevenue)}</span>
          </div>
        </div>

        {/* Operating Expenses & COGS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg font-bold text-xs text-slate-800 uppercase tracking-wider">
            <span>Operating Expenses & COGS (5000/6000 Series)</span>
            <span>BDT Amount</span>
          </div>

          <div className="space-y-1 px-3 text-xs">
            {allExpenses.length === 0 ? (
              <div className="text-slate-400 py-2 italic text-center">No operating expenses recorded for this period.</div>
            ) : (
              allExpenses.map((acc) => (
                <div key={acc.id} className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-700 font-medium">
                    <span className="font-mono text-amber-600 mr-2">{acc.code}</span>
                    {acc.name}
                  </span>
                  <span className="font-semibold text-slate-900 font-mono">{formatBDT(acc.balance)}</span>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between p-3 bg-amber-50/70 border border-amber-100 rounded-lg text-xs font-bold text-amber-900">
            <span>TOTAL OPERATING EXPENSES & COGS</span>
            <span className="font-mono">{formatBDT(totalAllExpenses)}</span>
          </div>
        </div>

        {/* Gross & Net Profit Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase">Gross Profit</span>
            <span className={`text-base font-bold font-mono ${grossProfit >= 0 ? "text-blue-600" : "text-rose-600"}`}>
              {formatBDT(grossProfit)}
            </span>
          </div>

          <div className={`p-4 rounded-xl flex items-center justify-between shadow-xs ${netProfit >= 0 ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block">Net {netProfit >= 0 ? "Profit" : "Loss"}</span>
              <span className="text-[10px] opacity-80">Gross Profit - Total Expenses</span>
            </div>
            <span className="text-lg font-bold font-mono">
              {formatBDT(netProfit)}
            </span>
          </div>
        </div>
      </div>
    </ReportLayout>
  );
}
