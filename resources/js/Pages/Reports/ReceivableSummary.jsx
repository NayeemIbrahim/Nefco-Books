import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";
import { Users, FileText, CheckCircle2, Clock } from "lucide-react";

export default function ReceivableSummary({
  totalInvoiced = 0,
  totalPaid = 0,
  balanceDue = 0,
  unpaidCount = 0,
  paidCount = 0,
  filters = {},
}) {
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 100;

  return (
    <ReportLayout title="Receivable Summary" filters={filters}>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 block">Total Invoiced Sales</span>
            <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">{formatBDT(totalInvoiced)}</span>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-xs font-semibold text-emerald-700 block">Total Collections</span>
            <span className="text-xl font-bold font-mono text-emerald-900 mt-1 block">{formatBDT(totalPaid)}</span>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">{paidCount} Fully Settled Invoices</span>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-xs font-semibold text-amber-700 block">Total Balance Due</span>
            <span className="text-xl font-bold font-mono text-amber-900 mt-1 block">{formatBDT(balanceDue)}</span>
            <span className="text-[10px] text-amber-600 mt-0.5 block">{unpaidCount} Pending / Overdue</span>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-xs font-semibold text-blue-700 block">Collection Rate</span>
            <span className="text-xl font-bold font-mono text-blue-900 mt-1 block">{collectionRate}%</span>
            <span className="text-[10px] text-blue-600 mt-0.5 block">Of total billed sales collected</span>
          </div>
        </div>

        {/* Efficiency Bar */}
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Overall Collection Progress</span>
            <span className="font-mono">{collectionRate}% Complete</span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${collectionRate}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 pt-1">
            <span>Collected: {formatBDT(totalPaid)}</span>
            <span>Pending: {formatBDT(balanceDue)}</span>
          </div>
        </div>
      </div>
    </ReportLayout>
  );
}
