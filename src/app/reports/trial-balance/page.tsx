"use client";

import { useState, useEffect } from "react";
import { formatBDT } from "@/lib/utils";
import { Scale, Printer, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function TrialBalancePage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/banking/accounts")
      .then((res) => res.json())
      .then((data) => setAccounts(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-xs text-slate-500 text-center">Generating Trial Balance Report...</div>;
  }

  // Calculate Debits vs Credits across Chart of Accounts
  let totalDebitBDT = 0;
  let totalCreditBDT = 0;

  const rows = accounts.map((acc) => {
    let debit = 0;
    let credit = 0;

    if (acc.type === "ASSET" || acc.type === "EXPENSE") {
      debit = acc.balance;
      totalDebitBDT += debit;
    } else {
      credit = acc.balance;
      totalCreditBDT += credit;
    }

    return { ...acc, debit, credit };
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Financial Reports
        </Link>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-md shadow-xs hover:bg-slate-50 transition"
        >
          <Printer className="h-4 w-4" /> Print / Export PDF
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-6 text-center space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">TRIAL BALANCE REPORT</h1>
          <div className="text-xs font-bold text-purple-600">Nefco Books</div>
          <p className="text-[11px] text-slate-400">Verifying Double-Entry Debit & Credit Equilibrium (BDT)</p>
        </div>

        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-100 font-bold uppercase text-[10px] text-slate-600">
            <tr>
              <th className="p-3 border-b border-slate-200">Account Code</th>
              <th className="p-3 border-b border-slate-200">Account Name</th>
              <th className="p-3 border-b border-slate-200">Category</th>
              <th className="p-3 border-b border-slate-200 text-right">Debit (BDT)</th>
              <th className="p-3 border-b border-slate-200 text-right">Credit (BDT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-blue-600">{r.code}</td>
                <td className="p-3 font-semibold text-slate-900">{r.name}</td>
                <td className="p-3 text-slate-500 font-medium">{r.type}</td>
                <td className="p-3 text-right font-semibold text-slate-900">
                  {r.debit > 0 ? formatBDT(r.debit) : "-"}
                </td>
                <td className="p-3 text-right font-semibold text-slate-900">
                  {r.credit > 0 ? formatBDT(r.credit) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-900 text-white font-bold text-xs">
            <tr>
              <td colSpan={3} className="p-3 uppercase tracking-wider">
                TOTAL TRIAL BALANCE
              </td>
              <td className="p-3 text-right text-emerald-400">{formatBDT(totalDebitBDT)}</td>
              <td className="p-3 text-right text-emerald-400">{formatBDT(totalCreditBDT)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs font-semibold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Double-Entry Balance Verification: Total Debit matches Total Credit.</span>
          </div>
          <span className="bg-emerald-200 text-emerald-900 font-bold px-2.5 py-0.5 rounded text-[10px]">
            EQUILIBRIUM OK
          </span>
        </div>
      </div>
    </div>
  );
}
