import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";

export default function PaymentsMade({
  payments = [],
  totalAmount = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Payments Made (Vendor Disbursements)" filters={filters}>
      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 min-w-[700px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Payment #</th>
                <th className="py-2.5 px-3">Payment Date</th>
                <th className="py-2.5 px-3">Vendor Name</th>
                <th className="py-2.5 px-3">Bill #</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3">Reference #</th>
                <th className="py-2.5 px-3 text-right">Amount Paid (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 italic">No payments made in this period.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-mono font-bold text-amber-700">{p.payment_number}</td>
                    <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">{p.payment_date}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{p.vendor_name}</td>
                    <td className="py-2 px-3 font-mono text-amber-700">{p.bill_number}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">{p.reference_number}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatBDT(p.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {payments.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan="6" className="py-2.5 px-3 uppercase text-right">Total Payments Made</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-800 text-sm">{formatBDT(totalAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </ReportLayout>
  );
}
