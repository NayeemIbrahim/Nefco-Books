import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";

export default function SalesSummary({
  totalInvoices = 0,
  subtotal = 0,
  taxAmount = 0,
  discount = 0,
  shipping = 0,
  adjustment = 0,
  totalSales = 0,
  paidAmount = 0,
  balanceDue = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Sales Summary" filters={filters}>
      <div className="space-y-6">
        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs text-slate-500 font-medium block">Total Invoices</span>
            <span className="text-xl font-bold text-slate-800">{totalInvoices}</span>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-xs text-blue-700 font-medium block">Gross Sales</span>
            <span className="text-xl font-bold font-mono text-blue-900">{formatBDT(subtotal)}</span>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-xs text-emerald-700 font-medium block">Total Received</span>
            <span className="text-xl font-bold font-mono text-emerald-900">{formatBDT(paidAmount)}</span>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-xs text-amber-700 font-medium block">Balance Due</span>
            <span className="text-xl font-bold font-mono text-amber-900">{formatBDT(balanceDue)}</span>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700">
            Sales Breakdown
          </div>
          <table className="w-full min-w-[400px] text-xs text-left text-slate-600">
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-medium text-slate-700">Subtotal (Gross Item Sales)</td>
                <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">{formatBDT(subtotal)}</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-medium text-slate-700">Discounts Allowed</td>
                <td className="py-2.5 px-4 text-right font-mono text-rose-600">-{formatBDT(discount)}</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-medium text-slate-700">Sales Tax / VAT</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-900">+{formatBDT(taxAmount)}</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-medium text-slate-700">Shipping & Delivery Charges</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-900">+{formatBDT(shipping)}</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-medium text-slate-700">Other Adjustments</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-900">{formatBDT(adjustment)}</td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td className="py-3 px-4 uppercase text-xs">Total Net Invoiced Sales</td>
                <td className="py-3 px-4 text-right font-mono text-sm text-blue-700">{formatBDT(totalSales)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </ReportLayout>
  );
}
