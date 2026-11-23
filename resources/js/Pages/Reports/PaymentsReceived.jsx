import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";
import { Link } from "@inertiajs/react";

export default function PaymentsReceived({
  payments = [],
  totalAmount = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Payments Received" filters={filters}>
      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 min-w-[700px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Payment #</th>
                <th className="py-2.5 px-3">Payment Date</th>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3">Reference #</th>
                <th className="py-2.5 px-3 text-right">Amount Received (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 italic">No payments received in this period.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-mono font-bold">
                      <Link href="/sales/payments-received" className="text-emerald-700 hover:text-emerald-900 hover:underline">
                        {p.payment_number}
                      </Link>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">{p.payment_date}</td>
                    <td className="py-2 px-3 font-semibold">
                      {p.contact_id ? (
                        <Link
                          href={`/reports/customer-statement?contact_id=${p.contact_id}`}
                          className="text-slate-800 hover:text-blue-600 hover:underline"
                          title="View Customer Statement"
                        >
                          {p.customer_name}
                        </Link>
                      ) : (
                        <span className="text-slate-800">{p.customer_name}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono">
                      <Link href="/sales/invoices" className="text-blue-600 hover:text-blue-800 hover:underline">
                        {p.invoice_number}
                      </Link>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">{p.reference_number}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatBDT(p.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {payments.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan="6" className="py-2.5 px-3 uppercase text-right">Total Payments Received</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm">{formatBDT(totalAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </ReportLayout>
  );
}
