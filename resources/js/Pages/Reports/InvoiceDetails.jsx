import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";
import { Link } from "@inertiajs/react";

export default function InvoiceDetails({
  invoices = [],
  totalAmountAll = 0,
  totalPaidAll = 0,
  totalBalanceDue = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Invoice Details" filters={filters}>
      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 min-w-[750px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Issue Date</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Invoice Amount (৳)</th>
                <th className="py-2.5 px-3 text-right">Paid Amount (৳)</th>
                <th className="py-2.5 px-3 text-right">Balance Due (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 italic">No invoices recorded in this period.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-mono font-bold">
                      <Link href="/sales/invoices" className="text-blue-600 hover:text-blue-800 hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">{inv.issue_date}</td>
                    <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">{inv.due_date || "-"}</td>
                    <td className="py-2 px-3 font-semibold">
                      {inv.contact_id ? (
                        <Link
                          href={`/reports/customer-statement?contact_id=${inv.contact_id}`}
                          className="text-slate-800 hover:text-blue-600 hover:underline"
                          title="View Customer Statement"
                        >
                          {inv.customer_name}
                        </Link>
                      ) : (
                        <span className="text-slate-800">{inv.customer_name}</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          inv.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : inv.status === "PARTIALLY PAID"
                            ? "bg-blue-100 text-blue-800"
                            : inv.status === "OVERDUE"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatBDT(inv.total_amount)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700">{formatBDT(inv.paid_amount)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      <span className={inv.balance_due > 0 ? "text-amber-700" : "text-slate-500"}>
                        {formatBDT(inv.balance_due)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {invoices.length > 0 && (
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
