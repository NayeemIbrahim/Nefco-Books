import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";
import { Link } from "@inertiajs/react";

export default function PurchasesByVendor({
  vendors = [],
  totalAmountAll = 0,
  totalPaidAll = 0,
  totalBalanceDue = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Purchases by Vendor" filters={filters}>
      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 min-w-[650px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Vendor Name</th>
                <th className="py-2.5 px-3">Phone</th>
                <th className="py-2.5 px-3 text-center">Bills</th>
                <th className="py-2.5 px-3 text-right">Total Purchases (৳)</th>
                <th className="py-2.5 px-3 text-right">Paid (৳)</th>
                <th className="py-2.5 px-3 text-right">Balance Due (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 italic">No vendor purchases recorded in this period.</td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-semibold">
                      <Link
                        href={`/reports/vendor-statement?contact_id=${v.id}`}
                        className="text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1"
                        title="View Vendor Statement"
                      >
                        {v.name}
                      </Link>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">{v.phone || "-"}</td>
                    <td className="py-2 px-3 text-center font-bold text-slate-700">{v.billCount}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatBDT(v.totalAmount)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700">{formatBDT(v.totalPaid)}</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-amber-700">{formatBDT(v.balanceDue)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {vendors.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan="3" className="py-2.5 px-3 uppercase text-right">Total</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-800">{formatBDT(totalAmountAll)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{formatBDT(totalPaidAll)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-700">{formatBDT(totalBalanceDue)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </ReportLayout>
  );
}
