import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { Calendar, Plus, ArrowRight, User, Package, CheckCircle2, Clock } from "lucide-react";
import { Head, router } from "@inertiajs/react";

export default function BookingsIndex({ bookings, contacts, items }) {
  const [filter, setFilter] = useState("ALL");

  const convertToInvoice = (bookingId) => {
    router.post(`/bookings/${bookingId}/convert`);
  };

  return (
    <AuthenticatedLayout>
      <Head title="Bookings & Orders - Nefco Books" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bookings & Advance Orders</h1>
            <p className="text-xs text-slate-500">Record customer service appointments, advance bookings, and convert to invoices</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-xs transition">
            <Plus className="h-4 w-4" />
            <span>New Booking</span>
          </button>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Booking #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Items / Details</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Advance Paid</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings?.data?.length > 0 ? (
                bookings.data.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/75 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {booking.booking_number}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-medium">
                      <div>{booking.contact?.name}</div>
                      <div className="text-[11px] text-slate-400">{booking.contact?.whatsapp_number}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>Booked: {new Date(booking.booking_date).toLocaleDateString("en-GB")}</span>
                      </div>
                      {booking.delivery_date && (
                        <div className="text-[11px] text-slate-400">
                          Due: {new Date(booking.delivery_date).toLocaleDateString("en-GB")}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="text-[11px] space-y-0.5">
                        {booking.line_items?.map((li, idx) => (
                          <div key={idx}>
                            {li.item?.name || "Service"} &times; {li.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatBDT(booking.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-medium">
                      {formatBDT(booking.advance_amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        booking.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700"
                          : booking.status === "CONFIRMED"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {booking.status !== "COMPLETED" && (
                        <button
                          onClick={() => convertToInvoice(booking.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-semibold border border-blue-200 transition"
                        >
                          <span>Convert to Invoice</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No bookings or advance orders recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
