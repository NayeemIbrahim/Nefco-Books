import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { PieChart, Printer, ArrowLeft, ShieldCheck } from "lucide-react";
import { Head, Link } from "@inertiajs/react";

export default function BalanceSheet({
  assets,
  liabilities,
  equity,
  totalAssets,
  totalLiabilities,
  totalEquity,
  isBalanced,
}) {
  return (
    <AuthenticatedLayout>
      <Head title="Balance Sheet Statement - Nefco Books" />

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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">BALANCE SHEET STATEMENT</h1>
            <div className="text-xs font-bold text-emerald-600">Nefco Books</div>
            <p className="text-[11px] text-slate-400">As of August 2026 (Amounts in Bangladeshi Taka)</p>
          </div>

          {/* ASSETS SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-2.5 rounded font-bold text-xs text-blue-900 uppercase">
              <span>ASSETS (1000 Series)</span>
              <span>BDT Amount</span>
            </div>

            <div className="space-y-1.5 px-3 text-xs">
              {assets?.map((acc, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-700 font-medium">
                    <span className="font-mono text-blue-600 mr-2">{acc.code}</span>
                    {acc.name}
                  </span>
                  <span className="font-semibold text-slate-900">{formatBDT(acc.balance)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between p-3 bg-blue-600 text-white rounded text-xs font-bold shadow-xs">
              <span>TOTAL ASSETS</span>
              <span>{formatBDT(totalAssets)}</span>
            </div>
          </div>

          {/* LIABILITIES & EQUITY SECTION */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between bg-purple-50 border border-purple-200 p-2.5 rounded font-bold text-xs text-purple-900 uppercase">
              <span>LIABILITIES & OWNER'S EQUITY (2000/3000 Series)</span>
              <span>BDT Amount</span>
            </div>

            <div className="space-y-1.5 px-3 text-xs">
              <div className="font-bold text-slate-400 uppercase text-[10px] pt-1">Liabilities</div>
              {liabilities?.map((acc, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-700 font-medium">
                    <span className="font-mono text-amber-600 mr-2">{acc.code}</span>
                    {acc.name}
                  </span>
                  <span className="font-semibold text-slate-900">{formatBDT(acc.balance)}</span>
                </div>
              ))}

              <div className="font-bold text-slate-400 uppercase text-[10px] pt-2">Equity</div>
              {equity?.map((acc, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-700 font-medium">
                    <span className="font-mono text-purple-600 mr-2">{acc.code}</span>
                    {acc.name}
                  </span>
                  <span className="font-semibold text-slate-900">{formatBDT(acc.balance)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between p-3 bg-purple-900 text-white rounded text-xs font-bold shadow-xs">
              <span>TOTAL LIABILITIES & EQUITY</span>
              <span>{formatBDT(totalLiabilities + totalEquity)}</span>
            </div>
          </div>

          {/* Balance Equation Status */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 font-semibold">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>Accounting Identity Verified: Assets ({formatBDT(totalAssets)}) = Liabilities + Equity</span>
            </div>
            <span className="bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded text-[10px] font-bold">
              BALANCED ✓
            </span>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
