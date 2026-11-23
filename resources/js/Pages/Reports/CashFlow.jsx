import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, DollarSign } from "lucide-react";

export default function CashFlow({
  customerReceipts = 0,
  vendorPayments = 0,
  directExpenses = 0,
  netOperatingCash = 0,
  investingCash = 0,
  financingCash = 0,
  beginningCash = 0,
  netChangeCash = 0,
  endingCash = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Cash Flow Statement" filters={filters}>
      <div className="space-y-6">
        {/* Operating Activities */}
        <div className="space-y-3">
          <div className="bg-slate-100 p-2.5 rounded-lg font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>1. Cash Flow from Operating Activities</span>
            <span>BDT Amount</span>
          </div>

          <div className="space-y-1.5 px-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-700 flex items-center gap-1.5">
                <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                Cash receipts from customers
              </span>
              <span className="font-mono text-emerald-700 font-semibold">{formatBDT(customerReceipts)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-700 flex items-center gap-1.5">
                <ArrowUpRight className="h-3.5 w-3.5 text-amber-600" />
                Cash paid to vendors & suppliers
              </span>
              <span className="font-mono text-amber-700 font-semibold">({formatBDT(vendorPayments)})</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-700 flex items-center gap-1.5">
                <ArrowUpRight className="h-3.5 w-3.5 text-rose-600" />
                Cash paid for operating expenses
              </span>
              <span className="font-mono text-rose-700 font-semibold">({formatBDT(directExpenses)})</span>
            </div>
          </div>

          <div className="flex justify-between p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs font-bold text-blue-900">
            <span>NET CASH FROM OPERATING ACTIVITIES</span>
            <span className="font-mono">{formatBDT(netOperatingCash)}</span>
          </div>
        </div>

        {/* Investing Activities */}
        <div className="space-y-3">
          <div className="bg-slate-100 p-2.5 rounded-lg font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>2. Cash Flow from Investing Activities</span>
            <span>BDT Amount</span>
          </div>
          <div className="px-3 text-xs text-slate-400 italic py-1">
            No fixed asset purchases or capital divestments recorded for this period.
          </div>
          <div className="flex justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
            <span>Net Cash from Investing Activities</span>
            <span className="font-mono">{formatBDT(investingCash)}</span>
          </div>
        </div>

        {/* Financing Activities */}
        <div className="space-y-3">
          <div className="bg-slate-100 p-2.5 rounded-lg font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>3. Cash Flow from Financing Activities</span>
            <span>BDT Amount</span>
          </div>
          <div className="px-3 text-xs text-slate-400 italic py-1">
            No external loan issuances or equity dividends recorded for this period.
          </div>
          <div className="flex justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
            <span>Net Cash from Financing Activities</span>
            <span className="font-mono">{formatBDT(financingCash)}</span>
          </div>
        </div>

        {/* Cash Summary */}
        <div className="p-5 bg-slate-900 text-white rounded-xl space-y-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Beginning Cash & Bank Balance:</span>
            <span className="font-mono font-semibold">{formatBDT(beginningCash)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-300">
            <span>Net Change in Cash:</span>
            <span className={`font-mono font-semibold ${netChangeCash >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {netChangeCash >= 0 ? "+" : ""}{formatBDT(netChangeCash)}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
            <span>Ending Cash & Bank Balance:</span>
            <span className="font-mono text-emerald-400">{formatBDT(endingCash)}</span>
          </div>
        </div>
      </div>
    </ReportLayout>
  );
}
