import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";
import { Link } from "@inertiajs/react";

export default function CustomerBalanceSummary({
  customers = [],
  totalReceivable = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Customer Balance Summary" filters={filters}>
      <div className="space-y-4">
        {/* Total Header Card */}
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block">Total Outstanding Receivables</span>
            <span className="text-[11px] text-sky-600">Net balance owed by customers across all active ledgers</span>
          </div>
          <span className="text-xl font-bold font-mono text-sky-900">{formatBDT(totalReceivable)}</span>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 min-w-[750px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Phone</th>
                <th className="py-2.5 px-3 text-right">Opening Balance (৳)</th>
                <th className="py-2.5 px-3 text-right">Total Invoiced (৳)</th>
                <th className="py-2.5 px-3 text-right">Payments Received (৳)</th>
                <th className="py-2.5 px-3 text-right">Closing Balance (৳)</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 italic">No customers found.</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-800">{c.name}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{c.phone || "-"}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {formatBDT(c.opening_balance)}
                      <span className="text-[9px] text-slate-400 ml-1">
                        ({c.opening_type === "TO_PAY" ? "To Pay" : "To Rec"})
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-900">{formatBDT(c.total_invoiced)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700">{formatBDT(c.total_received)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      <span className={c.closing_balance > 0 ? "text-blue-700" : c.closing_balance < 0 ? "text-amber-700" : "text-slate-700"}>
                        {formatBDT(c.closing_balance)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Link
                        href={`/reports/customer-statement?contact_id=${c.id}`}
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
