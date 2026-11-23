import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function BalanceSheet({
  assets = [],
  liabilities = [],
  equity = [],
  currentEarnings = 0,
  totalAssets = 0,
  totalLiabilities = 0,
  totalEquity = 0,
  asOfDate = "",
  isBalanced = true,
  filters = {},
}) {
  return (
    <ReportLayout title="Balance Sheet" subtitle={`As of ${asOfDate || "Today"} (Amounts in BDT)`} filters={filters}>
      <div className="space-y-6">
        {/* Balanced Banner */}
        <div
          className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold ${
            isBalanced
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {isBalanced ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
            <span>
              {isBalanced
                ? "The Balance Sheet is in equilibrium (Assets = Liabilities + Equity)."
                : "The Balance Sheet is out of balance. Please check journal entries."}
            </span>
          </div>
          <span className="font-mono">
            Variance: {formatBDT(Math.abs(totalAssets - (totalLiabilities + totalEquity)))}
          </span>
        </div>

        {/* 1. ASSETS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg font-bold text-xs text-slate-800 uppercase tracking-wider">
            <span>Assets (1000 Series)</span>
            <span>BDT Amount</span>
          </div>

          <div className="space-y-1 px-3 text-xs">
            {assets.map((acc) => (
              <div key={acc.id} className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-700 font-medium">
                  <span className="font-mono text-blue-600 mr-2">{acc.code}</span>
                  {acc.name}
                  <span className="text-[10px] text-slate-400 ml-1.5 font-normal">({acc.sub_type})</span>
                </span>
                <span className="font-semibold text-slate-900 font-mono">{formatBDT(acc.balance)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs font-bold text-blue-900">
            <span>TOTAL ASSETS</span>
            <span className="font-mono">{formatBDT(totalAssets)}</span>
          </div>
        </div>

        {/* 2. LIABILITIES */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg font-bold text-xs text-slate-800 uppercase tracking-wider">
            <span>Liabilities (2000 Series)</span>
            <span>BDT Amount</span>
          </div>

          <div className="space-y-1 px-3 text-xs">
            {liabilities.length === 0 ? (
              <div className="text-slate-400 py-2 italic text-center">No liabilities recorded.</div>
            ) : (
              liabilities.map((acc) => (
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
            <span>TOTAL LIABILITIES</span>
            <span className="font-mono">{formatBDT(totalLiabilities)}</span>
          </div>
        </div>

        {/* 3. EQUITY */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg font-bold text-xs text-slate-800 uppercase tracking-wider">
            <span>Equity (3000 Series)</span>
            <span>BDT Amount</span>
          </div>

          <div className="space-y-1 px-3 text-xs">
            {equity.map((acc) => (
              <div key={acc.id} className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-700 font-medium">
                  <span className="font-mono text-purple-600 mr-2">{acc.code}</span>
                  {acc.name}
                </span>
                <span className="font-semibold text-slate-900 font-mono">{formatBDT(acc.balance)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-700 font-medium">
                <span className="font-mono text-emerald-600 mr-2">3999</span>
                Current Period Net Earnings
              </span>
              <span className={`font-semibold font-mono ${currentEarnings >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                {formatBDT(currentEarnings)}
              </span>
            </div>
          </div>

          <div className="flex justify-between p-3 bg-purple-50/70 border border-purple-100 rounded-lg text-xs font-bold text-purple-900">
            <span>TOTAL EQUITY</span>
            <span className="font-mono">{formatBDT(totalEquity)}</span>
          </div>
        </div>

        {/* Liabilities + Equity Summary */}
        <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider">Total Liabilities & Equity</span>
          <span className="text-base font-bold font-mono">{formatBDT(totalLiabilities + totalEquity)}</span>
        </div>
      </div>
    </ReportLayout>
  );
}
