import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { Plus, Search, CalendarCheck, FileText, Trash2, X } from "lucide-react";
import { Head, router } from "@inertiajs/react";

export default function BookingsIndex({ bookings, contacts, items, filters }) {
  const [search, setSearch] = useState(filters?.search || "");
  const [statusFilter, setStatusFilter] = useState(filters?.status || "ALL");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form State
  const [formContactName, setFormContactName] = useState("Rahim Chowdhury");
  const [formWhatsapp, setFormWhatsapp] = useState("+8801711223344");
  const [formServiceDate, setFormServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");
  const [formLineItems, setFormLineItems] = useState([
    { description: "Service Booking", quantity: 1, unit_price: 25000, amount: 25000 },
  ]);

  const handleAddLineItem = () => {
    setFormLineItems([
      ...formLineItems,
      { description: "Service Booking", quantity: 1, unit_price: 0, amount: 0 },
    ]);
  };

  const handleRemoveLineItem = (index) => {
    if (formLineItems.length <= 1) return;
    setFormLineItems(formLineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = [...formLineItems];
    const item = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      item.amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    }
    updated[index] = item;
    setFormLineItems(updated);
  };

  const totalCalculatedBDT = formLineItems.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    router.post(
      "/bookings",
      {
        contact_name: formContactName,
        whatsapp_number: formWhatsapp,
        booking_date: formServiceDate,
        total_amount: totalCalculatedBDT,
        notes: formNotes,
        line_items: formLineItems,
      },
      {
        onSuccess: () => {
          setIsDrawerOpen(false);
        },
      }
    );
  };

  const bookingList = bookings?.data || bookings || [];

  return (
    <AuthenticatedLayout>
      <Head title="Bookings & Orders - Nefco Books" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Orders & Bookings</h1>
            <p className="text-xs text-slate-500">Record customer service requests, manage bookings, and convert to invoices</p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Booking</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
              <tr>
                <th className="py-3 px-4">Booking #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Booking Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Order Total (BDT)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookingList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No bookings found. Click "New Booking" to create one.
                  </td>
                </tr>
              ) : (
                bookingList.map((bkg) => (
                  <tr key={bkg.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {bkg.booking_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{bkg.contact?.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {bkg.contact?.whatsapp_number}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(bkg.booking_date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          bkg.status === "CONFIRMED"
                            ? "bg-blue-100 text-blue-800"
                            : bkg.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {bkg.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatBDT(bkg.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => router.post(`/bookings/${bkg.id}/convert`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-xs"
                      >
                        <FileText className="h-3 w-3" />
                        <span>1-Click Convert to Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Drawer Form */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Create Order / Booking</h2>
                  <p className="text-xs text-slate-500">Record customer service request</p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={formContactName}
                      onChange={(e) => setFormContactName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">WhatsApp Number *</label>
                    <input
                      type="text"
                      required
                      value={formWhatsapp}
                      onChange={(e) => setFormWhatsapp(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Service / Delivery Date</label>
                  <input
                    type="date"
                    value={formServiceDate}
                    onChange={(e) => setFormServiceDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>

                {/* Line Items Builder */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Line Items (BDT)</label>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Line Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formLineItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-200">
                        <input
                          type="text"
                          placeholder="Description..."
                          value={item.description}
                          onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                          className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(index, "quantity", e.target.value)}
                          className="w-16 px-2 py-1 text-xs border border-slate-300 rounded bg-white font-semibold text-center"
                        />
                        <input
                          type="number"
                          placeholder="Rate (BDT)"
                          value={item.unit_price}
                          onChange={(e) => handleLineItemChange(index, "unit_price", e.target.value)}
                          className="w-24 px-2 py-1 text-xs border border-slate-300 rounded bg-white font-bold text-right"
                        />
                        <div className="w-24 text-right font-bold text-xs text-slate-800">
                          {formatBDT(item.amount)}
                        </div>
                        {formLineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(index)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2 text-xs font-bold text-slate-900 border-t border-slate-100">
                    Total Order Amount: {formatBDT(totalCalculatedBDT)}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Order Notes</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Special instructions or service terms..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-xs"
                  >
                    Save Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
