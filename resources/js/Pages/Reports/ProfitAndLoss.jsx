import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { TrendingUp, ArrowLeft, Printer } from "lucide-react";
import { Head, Link } from "@inertiajs/react";

export default function ProfitAndLoss({
  revenues,
  cogs,
  expenses,
  totalRevenue,
  grossProfit,
  totalExpense,
  netProfit,
}) {
  return (
    <AuthenticatedLayout>
      <Head title="Profit and Loss Statement - Nefco Books" />

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
            <span>Print Report</span>
          </button>
        </div>

        {/* Statement Sheet */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 space-y-6">
          <div className="text-center border-b border-slate-100 pb-4">
            <h1 className="text-lg font-bold text-slate-900">Profit & Loss Statement</h1>
            <p className="text-xs text-slate-500 font-medium">Nefco Books &bull; All Currencies in BDT (৳)</p>
          </div>

          <div className="space-y-6 text-xs">
            {/* Operating Revenue */}
            <div>
              <div className="bg-slate-50 px-3 py-1.5 font-bold text-slate-800 uppercase tracking-wider text-[11px] rounded flex justify-between">
                <span>Operating Revenue</span>
                <span>Amount (৳)</span>
              </div>
              <div className="divide-y divide-slate-100 mt-1">
                {revenues?.map((acc) => (
                  <div key={acc.id} className="py-2 px-3 flex justify-between">
                    <span className="text-slate-700">{acc.code} - {acc.name}</span>
                    <span className="font-mono font-medium text-slate-900">{formatBDT(acc.balance)}</span>
                  </div>
                ))}
              </div>
              <div className="py-2 px-3 bg-blue-50/50 rounded flex justify-between font-bold text-slate-900 mt-1">
                <span>Total Operating Revenue</span>
                <span className="font-mono text-blue-600">{formatBDT(totalRevenue)}</span>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div>
              <div className="bg-slate-50 px-3 py-1.5 font-bold text-slate-800 uppercase tracking-wider text-[11px] rounded flex justify-between">
                <span>Cost of Goods Sold (COGS)</span>
                <span>Amount (৳)</span>
              </div>
              <div className="divide-y divide-slate-100 mt-1">
                {cogs?.length > 0 ? (
                  cogs.map((acc) => (
                    <div key={acc.id} className="py-2 px-3 flex justify-between">
                      <span className="text-slate-700">{acc.code} - {acc.name}</span>
                      <span className="font-mono font-medium text-slate-900">{formatBDT(acc.balance)}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-2 px-3 text-slate-400">No COGS accounts active</div>
                )}
              </div>
            </div>

            {/* Gross Profit */}
            <div className="py-3 px-4 bg-slate-100/80 rounded-lg flex justify-between font-bold text-sm text-slate-900 border border-slate-200">
              <span>Gross Profit (Revenue - COGS)</span>
              <span className="font-mono">{formatBDT(grossProfit)}</span>
            </div>

            {/* Operating Expenses */}
            <div>
              <div className="bg-slate-50 px-3 py-1.5 font-bold text-slate-800 uppercase tracking-wider text-[11px] rounded flex justify-between">
                <span>Operating Expenses</span>
                <span>Amount (৳)</span>
              </div>
              <div className="divide-y divide-slate-100 mt-1">
                {expenses?.map((acc) => (
                  <div key={acc.id} className="py-2 px-3 flex justify-between">
                    <span className="text-slate-700">{acc.code} - {acc.name}</span>
                    <span className="font-mono font-medium text-slate-900">{formatBDT(acc.balance)}</span>
                  </div>
                ))}
              </div>
              <div className="py-2 px-3 bg-slate-50 rounded flex justify-between font-bold text-slate-900 mt-1">
                <span>Total Operating Expenses</span>
                <span className="font-mono text-slate-800">{formatBDT(totalExpense)}</span>
              </div>
            </div>

            {/* Net Profit / Loss */}
            <div className={`py-4 px-4 rounded-lg flex justify-between font-bold text-base border ${
              netProfit >= 0
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}>
              <span>Net Profit / (Loss)</span>
              <span className="font-mono">{formatBDT(netProfit)}</span>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
