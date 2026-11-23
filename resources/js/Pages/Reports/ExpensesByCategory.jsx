import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";

export default function ExpensesByCategory({
  categories = [],
  totalAmount = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Expenses by Category" filters={filters}>
      <div className="space-y-6">
        {/* Total Expense Header */}
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">Total Operating Expenses</span>
            <span className="text-[11px] text-rose-600">Categorical distribution across active cost centers</span>
          </div>
          <span className="text-xl font-bold font-mono text-rose-900">{formatBDT(totalAmount)}</span>
        </div>

        {/* Categories Table */}
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 min-w-[600px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Expense Category</th>
                <th className="py-2.5 px-3 text-center">Transactions</th>
                <th className="py-2.5 px-3">Share of Total Spend</th>
                <th className="py-2.5 px-3 text-right">Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400 italic">No expenses recorded for this period.</td>
                </tr>
              ) : (
                categories.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{c.category}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">{c.count}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${c.percentage}%` }} />
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">{c.percentage}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatBDT(c.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {categories.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan="3" className="py-2.5 px-3 uppercase text-right">Total</td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-800 text-sm">{formatBDT(totalAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </ReportLayout>
  );
}
