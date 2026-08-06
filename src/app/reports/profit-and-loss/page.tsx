"use client";

import { useState, useEffect } from "react";
import { formatBDT } from "@/lib/utils";
import { BarChart3, Printer, ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import Link from "next/link";

export default function ProfitAndLossPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/profit-and-loss")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-xs text-slate-500 text-center">Generating Profit & Loss Statement...</div>;
  }

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
        {/* Title & Metadata */}
        <div className="border-b border-slate-200 pb-6 text-center space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">PROFIT & LOSS STATEMENT</h1>
          <div className="text-xs font-bold text-blue-600">Nefco Books</div>
          <p className="text-[11px] text-slate-400">For Financial Year 2026-2027 (Amounts in Bangladeshi Taka)</p>
        </div>

        {/* Operating Revenue Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded font-bold text-xs text-slate-800 uppercase tracking-wider">
            <span>Operating Revenue (4000 Series)</span>
            <span>BDT Amount</span>
          </div>

          <div className="space-y-1.5 px-3 text-xs">
            {data.revenueAccounts?.map((acc: any, idx: number) => (
              <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700 font-medium">
                  <span className="font-mono text-blue-600 mr-2">{acc.code}</span>
                  {acc.name}
                </span>
                <span className="font-semibold text-slate-900">{formatBDT(acc.balance)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between p-3 bg-blue-50/70 border border-blue-100 rounded text-xs font-bold text-blue-900">
            <span>TOTAL OPERATING REVENUE</span>
            <span>{formatBDT(data.totalRevenue)}</span>
          </div>
        </div>

        {/* Operating Expenses Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded font-bold text-xs text-slate-800 uppercase tracking-wider">
            <span>Operating Expenses & COGS (5000/6000 Series)</span>
            <span>BDT Amount</span>
          </div>

          <div className="space-y-1.5 px-3 text-xs">
            {data.expenseAccounts?.map((acc: any, idx: number) => (
              <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700 font-medium">
                  <span className="font-mono text-amber-600 mr-2">{acc.code}</span>
                  {acc.name}
                </span>
                <span className="font-semibold text-slate-900">{formatBDT(acc.balance)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between p-3 bg-amber-50/70 border border-amber-100 rounded text-xs font-bold text-amber-900">
            <span>TOTAL OPERATING EXPENSES</span>
            <span>{formatBDT(data.totalExpenses)}</span>
          </div>
        </div>

        {/* Net Profit Summary */}
        <div className="p-5 bg-emerald-600 text-white rounded-xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <div className="text-xs uppercase font-semibold text-emerald-200 tracking-wider">
              Net Profit (Revenue - Expenses)
            </div>
            <div className="text-2xl font-extrabold">{formatBDT(data.netProfit)}</div>
          </div>
          <div className="p-3 bg-emerald-700/60 rounded-lg">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
