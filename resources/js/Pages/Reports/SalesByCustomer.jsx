import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";

export default function SalesByCustomer({
  customers = [],
  totalSalesAll = 0,
  totalPaidAll = 0,
  totalBalanceDueAll = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Sales by Customer" filters={filters}>
      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 min-w-[650px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Phone</th>
                <th className="py-2.5 px-3 text-center">Invoices</th>
                <th className="py-2.5 px-3 text-right">Total Sales (৳)</th>
                <th className="py-2.5 px-3 text-right">Paid (৳)</th>
                <th className="py-2.5 px-3 text-right">Balance Due (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 italic">No customer sales recorded in this period.</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-800">{c.name}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{c.phone || "-"}</td>
                    <td className="py-2 px-3 text-center font-bold text-slate-700">{c.invCount}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatBDT(c.totalSales)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700">{formatBDT(c.totalPaid)}</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-amber-700">{formatBDT(c.balanceDue)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {customers.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan="3" className="py-2.5 px-3 uppercase text-right">Total</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-700">{formatBDT(totalSalesAll)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{formatBDT(totalPaidAll)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-700">{formatBDT(totalBalanceDueAll)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </ReportLayout>
  );
}
