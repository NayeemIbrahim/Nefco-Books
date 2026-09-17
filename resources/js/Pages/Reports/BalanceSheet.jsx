import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { Scale, ArrowLeft, Printer, ShieldCheck, AlertCircle } from "lucide-react";
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
      <Head title="Balance Sheet - Nefco Books" />

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
            <span>Print Statement</span>
          </button>
        </div>

        {/* Statement Sheet */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 space-y-6">
          <div className="text-center border-b border-slate-100 pb-4">
            <h1 className="text-lg font-bold text-slate-900">Balance Sheet</h1>
            <p className="text-xs text-slate-500 font-medium">As on Today &bull; Assets = Liabilities + Equity</p>
          </div>

          <div className="space-y-6 text-xs">
            {/* Assets */}
            <div>
              <div className="bg-slate-50 px-3 py-1.5 font-bold text-slate-800 uppercase tracking-wider text-[11px] rounded flex justify-between">
                <span>1. ASSETS</span>
                <span>Amount (৳)</span>
              </div>
              <div className="divide-y divide-slate-100 mt-1">
                {assets?.map((acc) => (
                  <div key={acc.id} className="py-2 px-3 flex justify-between">
                    <span className="text-slate-700">{acc.code} - {acc.name}</span>
                    <span className="font-mono font-medium text-slate-900">{formatBDT(acc.balance)}</span>
                  </div>
                ))}
              </div>
              <div className="py-2.5 px-3 bg-blue-50/60 rounded flex justify-between font-bold text-slate-900 mt-1">
                <span>Total Assets</span>
                <span className="font-mono text-blue-600">{formatBDT(totalAssets)}</span>
              </div>
            </div>

            {/* Liabilities */}
            <div>
              <div className="bg-slate-50 px-3 py-1.5 font-bold text-slate-800 uppercase tracking-wider text-[11px] rounded flex justify-between">
                <span>2. LIABILITIES</span>
                <span>Amount (৳)</span>
              </div>
              <div className="divide-y divide-slate-100 mt-1">
                {liabilities?.map((acc) => (
                  <div key={acc.id} className="py-2 px-3 flex justify-between">
                    <span className="text-slate-700">{acc.code} - {acc.name}</span>
                    <span className="font-mono font-medium text-slate-900">{formatBDT(acc.balance)}</span>
                  </div>
                ))}
              </div>
              <div className="py-2.5 px-3 bg-slate-50 rounded flex justify-between font-bold text-slate-900 mt-1">
                <span>Total Liabilities</span>
                <span className="font-mono text-slate-800">{formatBDT(totalLiabilities)}</span>
              </div>
            </div>

            {/* Equity */}
            <div>
              <div className="bg-slate-50 px-3 py-1.5 font-bold text-slate-800 uppercase tracking-wider text-[11px] rounded flex justify-between">
                <span>3. EQUITY</span>
                <span>Amount (৳)</span>
              </div>
              <div className="divide-y divide-slate-100 mt-1">
                {equity?.map((acc) => (
                  <div key={acc.id} className="py-2 px-3 flex justify-between">
                    <span className="text-slate-700">{acc.code} - {acc.name}</span>
                    <span className="font-mono font-medium text-slate-900">{formatBDT(acc.balance)}</span>
                  </div>
                ))}
              </div>
              <div className="py-2.5 px-3 bg-slate-50 rounded flex justify-between font-bold text-slate-900 mt-1">
                <span>Total Equity</span>
                <span className="font-mono text-slate-800">{formatBDT(totalEquity)}</span>
              </div>
            </div>

            {/* Total Liabilities & Equity vs Assets Balance Check */}
            <div className={`p-4 rounded-lg flex items-center justify-between border ${
              isBalanced
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}>
              <div className="flex items-center gap-2">
                {isBalanced ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-600" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {isBalanced ? "Balance Sheet Strictly Balanced" : "Balance Sheet Discrepancy"}
                  </div>
                  <div className="text-[11px] opacity-80">
                    Total Assets ({formatBDT(totalAssets)}) = Liabilities & Equity ({formatBDT(totalLiabilities + totalEquity)})
                  </div>
                </div>
              </div>
              <span className="font-mono font-bold text-base">
                {formatBDT(totalLiabilities + totalEquity)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
