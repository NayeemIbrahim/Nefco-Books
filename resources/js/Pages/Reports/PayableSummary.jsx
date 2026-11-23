import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";

export default function PayableSummary({
  totalBilled = 0,
  totalPaid = 0,
  balanceDue = 0,
  unpaidCount = 0,
  paidCount = 0,
  filters = {},
}) {
  const settlementRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 100;

  return (
    <ReportLayout title="Payable Summary" filters={filters}>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 block">Total Billed Purchases</span>
            <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">{formatBDT(totalBilled)}</span>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-xs font-semibold text-emerald-700 block">Total Paid Out</span>
            <span className="text-xl font-bold font-mono text-emerald-900 mt-1 block">{formatBDT(totalPaid)}</span>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">{paidCount} Fully Paid Bills</span>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-xs font-semibold text-amber-700 block">Outstanding Payables</span>
            <span className="text-xl font-bold font-mono text-amber-900 mt-1 block">{formatBDT(balanceDue)}</span>
            <span className="text-[10px] text-amber-600 mt-0.5 block">{unpaidCount} Pending / Overdue</span>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <span className="text-xs font-semibold text-indigo-700 block">Settlement Rate</span>
            <span className="text-xl font-bold font-mono text-indigo-900 mt-1 block">{settlementRate}%</span>
            <span className="text-[10px] text-indigo-600 mt-0.5 block">Of total billed obligations paid</span>
          </div>
        </div>

        {/* Settlement Bar */}
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Overall Payables Settlement</span>
            <span className="font-mono">{settlementRate}% Settled</span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${settlementRate}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 pt-1">
            <span>Disbursed: {formatBDT(totalPaid)}</span>
            <span>Outstanding Due: {formatBDT(balanceDue)}</span>
          </div>
        </div>
      </div>
    </ReportLayout>
  );
}
