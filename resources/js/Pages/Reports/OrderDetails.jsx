import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";

export default function OrderDetails({
  bookings = [],
  totalAmount = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Order & Booking Details" filters={filters}>
      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 min-w-[700px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Order / Deal #</th>
                <th className="py-2.5 px-3">Booking Date</th>
                <th className="py-2.5 px-3">Service Date</th>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3 text-right">Total Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 italic">No bookings or quotes found for this period.</td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-mono font-bold text-blue-600">
                      {b.order_number || b.booking_number}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">{b.booking_date}</td>
                    <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">{b.service_date || "-"}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{b.customer_name}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">{b.invoice_number || "-"}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatBDT(b.total_amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {bookings.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan="6" className="py-2.5 px-3 uppercase text-right">Total Orders Amount</td>
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
