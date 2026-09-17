import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { FileSpreadsheet, ArrowLeft, Printer, ShieldCheck, AlertCircle } from "lucide-react";
import { Head, Link } from "@inertiajs/react";

export default function TrialBalance({ accounts, totalDebit, totalCredit, isEquilibrium }) {
  return (
    <AuthenticatedLayout>
      <Head title="Trial Balance - Nefco Books" />

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Reports</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Trial Balance</span>
          </button>
        </div>

        {/* Trial Balance Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 space-y-6">
          <div className="text-center border-b border-slate-100 pb-4">
            <h1 className="text-lg font-bold text-slate-900">General Ledger Trial Balance</h1>
            <p className="text-xs text-slate-500 font-medium">Verification of Mathematical Equilibrium &bull; Total Debits = Total Credits</p>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Account Title</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Debit (৳)</th>
                <th className="py-2.5 px-3 text-right">Credit (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts?.map((acc) => (
                <tr key={acc.code} className="hover:bg-slate-50/75">
                  <td className="py-2 px-3 font-mono font-bold text-blue-600">{acc.code}</td>
                  <td className="py-2 px-3 text-slate-800 font-medium">{acc.name}</td>
                  <td className="py-2 px-3 text-slate-500 text-[11px]">{acc.type}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900">
                    {parseFloat(acc.total_debit) > 0 ? formatBDT(acc.total_debit) : "-"}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900">
                    {parseFloat(acc.total_credit) > 0 ? formatBDT(acc.total_credit) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
                <td colSpan={3} className="py-3 px-3 uppercase">Total Ledger Turnover</td>
                <td className="py-3 px-3 text-right font-mono">{formatBDT(totalDebit)}</td>
                <td className="py-3 px-3 text-right font-mono">{formatBDT(totalCredit)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Equilibrium Status Indicator */}
          <div className={`p-4 rounded-lg flex items-center justify-between border ${
            isEquilibrium
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}>
            <div className="flex items-center gap-2">
              {isEquilibrium ? (
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-600" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {isEquilibrium ? "Trial Balance is in Complete Equilibrium" : "Trial Balance Unbalanced"}
                </div>
                <div className="text-[11px] opacity-80">
                  {isEquilibrium
                    ? "Debit and Credit totals match exactly to 2 decimal places."
                    : `Difference of ${formatBDT(Math.abs(totalDebit - totalCredit))} detected.`}
                </div>
              </div>
            </div>
            <span className="font-mono font-bold text-base">
              {formatBDT(totalDebit)}
            </span>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
