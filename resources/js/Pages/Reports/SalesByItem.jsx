import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";

export default function SalesByItem({
  items = [],
  totalAmount = 0,
  totalQty = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Sales by Item" filters={filters}>
      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 min-w-[600px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Item / Service Name</th>
                <th className="py-2.5 px-3 text-right">Quantity Sold</th>
                <th className="py-2.5 px-3 text-right">Average Rate (৳)</th>
                <th className="py-2.5 px-3 text-right">Total Sales (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400 italic">No item sales recorded for this period.</td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">{item.quantity}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">{formatBDT(item.averageRate)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatBDT(item.totalAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="py-2.5 px-3 uppercase text-right">Total</td>
                  <td className="py-2.5 px-3 text-right font-mono">{totalQty}</td>
                  <td className="py-2.5 px-3 text-right font-mono">-</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-700">{formatBDT(totalAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </ReportLayout>
  );
}
