import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";

export default function BillDetails({
  bills = [],
  totalAmountAll = 0,
  totalPaidAll = 0,
  totalBalanceDue = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Bill Details" filters={filters}>
      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 min-w-[750px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Bill #</th>
                <th className="py-2.5 px-3">Bill Date</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Vendor Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Bill Amount (৳)</th>
                <th className="py-2.5 px-3 text-right">Paid Amount (৳)</th>
                <th className="py-2.5 px-3 text-right">Balance Due (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 italic">No bills recorded in this period.</td>
                </tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-mono font-bold text-amber-700">{b.bill_number}</td>
                    <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">{b.issue_date}</td>
                    <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">{b.due_date || "-"}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{b.vendor_name}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          b.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "PARTIALLY PAID"
                            ? "bg-blue-100 text-blue-800"
                            : b.status === "OVERDUE"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatBDT(b.total_amount)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700">{formatBDT(b.paid_amount)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      <span className={b.balance_due > 0 ? "text-amber-700" : "text-slate-500"}>
                        {formatBDT(b.balance_due)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {bills.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan="5" className="py-2.5 px-3 uppercase text-right">Total</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-700">{formatBDT(totalAmountAll)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{formatBDT(totalPaidAll)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-700">{formatBDT(totalBalanceDue)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </ReportLayout>
  );
}
