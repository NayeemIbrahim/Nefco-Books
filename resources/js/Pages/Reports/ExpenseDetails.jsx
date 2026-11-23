import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";

export default function ExpenseDetails({
  expenses = [],
  totalAmount = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Expense Details" filters={filters}>
      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 min-w-[750px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Expense #</th>
                <th className="py-2.5 px-3">Expense Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Expense Account</th>
                <th className="py-2.5 px-3">Paid Through</th>
                <th className="py-2.5 px-3">Vendor / Payee</th>
                <th className="py-2.5 px-3 text-right">Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 italic">No expense entries found for this period.</td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-mono font-bold text-rose-700">{e.expense_number}</td>
                    <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">{e.expense_date}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{e.category}</td>
                    <td className="py-2 px-3 text-slate-700">{e.account_name}</td>
                    <td className="py-2 px-3 font-medium text-slate-600">{e.paid_through_account}</td>
                    <td className="py-2 px-3 text-slate-600">{e.vendor_name}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                      {formatBDT(e.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {expenses.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan="6" className="py-2.5 px-3 uppercase text-right">Total Operating Expenses</td>
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
