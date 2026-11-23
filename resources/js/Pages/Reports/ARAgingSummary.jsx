import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";

export default function ARAgingSummary({
  buckets = { current: 0, "1_30": 0, "31_60": 0, "61_90": 0, "90_plus": 0 },
  totalOverdue = 0,
  customerBreakdown = [],
  filters = {},
}) {
  return (
    <ReportLayout title="AR Aging Summary (Accounts Receivable Aging)" filters={filters}>
      <div className="space-y-6">
        {/* Aging Buckets Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-[11px] font-semibold text-emerald-800 block">Current (Not Due)</span>
            <span className="text-sm font-bold font-mono text-emerald-900">{formatBDT(buckets.current)}</span>
          </div>
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
            <span className="text-[11px] font-semibold text-sky-800 block">1 - 30 Days</span>
            <span className="text-sm font-bold font-mono text-sky-900">{formatBDT(buckets["1_30"])}</span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-[11px] font-semibold text-amber-800 block">31 - 60 Days</span>
            <span className="text-sm font-bold font-mono text-amber-900">{formatBDT(buckets["31_60"])}</span>
          </div>
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <span className="text-[11px] font-semibold text-orange-800 block">61 - 90 Days</span>
            <span className="text-sm font-bold font-mono text-orange-900">{formatBDT(buckets["61_90"])}</span>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
            <span className="text-[11px] font-semibold text-rose-800 block">90+ Days</span>
            <span className="text-sm font-bold font-mono text-rose-900">{formatBDT(buckets["90_plus"])}</span>
          </div>
          <div className="p-3 bg-slate-900 text-white rounded-xl">
            <span className="text-[11px] font-semibold text-slate-300 block">Total Due</span>
            <span className="text-sm font-bold font-mono text-white">{formatBDT(totalOverdue)}</span>
          </div>
        </div>

        {/* Customer Aging Breakdown Table */}
        <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-xs">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700">
            Customer Aging Breakdown
          </div>
          <table className="w-full text-xs text-left text-slate-600 min-w-[700px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3 text-right">Current</th>
                <th className="py-2.5 px-3 text-right">1 - 30 Days</th>
                <th className="py-2.5 px-3 text-right">31 - 60 Days</th>
                <th className="py-2.5 px-3 text-right">61 - 90 Days</th>
                <th className="py-2.5 px-3 text-right">90+ Days</th>
                <th className="py-2.5 px-3 text-right">Total Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerBreakdown.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 italic">No unpaid invoices found. All customer accounts are fully settled.</td>
                </tr>
              ) : (
                customerBreakdown.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-800">{row.name}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">{row.current > 0 ? formatBDT(row.current) : "-"}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">{row["1_30"] > 0 ? formatBDT(row["1_30"]) : "-"}</td>
                    <td className="py-2 px-3 text-right font-mono text-amber-700">{row["31_60"] > 0 ? formatBDT(row["31_60"]) : "-"}</td>
                    <td className="py-2 px-3 text-right font-mono text-orange-700">{row["61_90"] > 0 ? formatBDT(row["61_90"]) : "-"}</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-700 font-semibold">{row["90_plus"] > 0 ? formatBDT(row["90_plus"]) : "-"}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatBDT(row.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {customerBreakdown.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="py-2.5 px-3 uppercase text-right">Total</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatBDT(buckets.current)}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatBDT(buckets["1_30"])}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-700">{formatBDT(buckets["31_60"])}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-orange-700">{formatBDT(buckets["61_90"])}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-700">{formatBDT(buckets["90_plus"])}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-700 text-sm">{formatBDT(totalOverdue)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </ReportLayout>
  );
}
