import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";
import { Link } from "@inertiajs/react";

export default function VendorBalanceSummary({
  vendors = [],
  totalPayable = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Vendor Balance Summary" filters={filters}>
      <div className="space-y-4">
        {/* Total Header Card */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Total Outstanding Payables</span>
            <span className="text-[11px] text-amber-600">Net balance owed to vendors and suppliers across all active ledgers</span>
          </div>
          <span className="text-xl font-bold font-mono text-amber-900">{formatBDT(totalPayable)}</span>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 min-w-[750px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Vendor Name</th>
                <th className="py-2.5 px-3">Phone</th>
                <th className="py-2.5 px-3 text-right">Opening Balance (৳)</th>
                <th className="py-2.5 px-3 text-right">Total Billed (৳)</th>
                <th className="py-2.5 px-3 text-right">Payments Made (৳)</th>
                <th className="py-2.5 px-3 text-right">Closing Balance (৳)</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 italic">No vendors found.</td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-800">{v.name}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{v.phone || "-"}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {formatBDT(v.opening_balance)}
                      <span className="text-[9px] text-slate-400 ml-1">
                        ({v.opening_type === "TO_RECEIVE" ? "To Rec" : "To Pay"})
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-900">{formatBDT(v.total_billed)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700">{formatBDT(v.total_paid)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      <span className={v.closing_balance > 0 ? "text-amber-700" : v.closing_balance < 0 ? "text-blue-700" : "text-slate-700"}>
                        {formatBDT(v.closing_balance)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Link
                        href={`/reports/vendor-statement?contact_id=${v.id}`}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Statement
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ReportLayout>
  );
}
