import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function TrialBalance({
  accounts = [],
  totalDebit = 0,
  totalCredit = 0,
  isEquilibrium = true,
  filters = {},
}) {
  return (
    <ReportLayout title="Trial Balance" filters={filters}>
      <div className="space-y-4">
        {/* Equilibrium status banner */}
        <div
          className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold ${
            isEquilibrium
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {isEquilibrium ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
            <span>
              {isEquilibrium
                ? "The Trial Balance is in equilibrium (Total Debits = Total Credits)."
                : "Trial Balance is out of equilibrium! Discrepancy detected."}
            </span>
          </div>
          <span className="font-mono">
            Difference: {formatBDT(Math.abs(totalDebit - totalCredit))}
          </span>
        </div>

        {/* Table */}
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 min-w-[600px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Account Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Debit (৳)</th>
                <th className="py-2.5 px-3 text-right">Credit (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((acc) => (
                <tr key={acc.code} className="hover:bg-slate-50 transition">
                  <td className="py-2 px-3 font-mono font-bold text-blue-600">{acc.code}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{acc.name}</td>
                  <td className="py-2 px-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {acc.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900">
                    {acc.total_debit > 0 ? formatBDT(acc.total_debit) : "-"}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900">
                    {acc.total_credit > 0 ? formatBDT(acc.total_credit) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
              <tr>
                <td colSpan="3" className="py-2.5 px-3 text-right uppercase tracking-wider">
                  Total
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-blue-700">
                  {formatBDT(totalDebit)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-purple-700">
                  {formatBDT(totalCredit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </ReportLayout>
  );
}
