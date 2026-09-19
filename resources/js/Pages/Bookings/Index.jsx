import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { Plus, Search, CalendarCheck, FileText, Trash2, X, Phone, Calendar } from "lucide-react";
import { Head, router } from "@inertiajs/react";

export default function BookingsIndex({ bookings, contacts, items, filters }) {
  const [search, setSearch] = useState(filters?.search || "");
  const [statusFilter, setStatusFilter] = useState(filters?.status || "ALL");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const contactList = contacts || [];

  // Form State
  const [formContactName, setFormContactName] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formServiceDate, setFormServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");
  const [formLineItems, setFormLineItems] = useState([
    { description: "", quantity: 1, unit_price: 0, amount: 0 },
  ]);

  const handleSelectContact = (name) => {
    setFormContactName(name);
    const matched = contactList.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (matched && (matched.whatsapp_number || matched.phone)) {
      setFormWhatsapp(matched.whatsapp_number || matched.phone);
    }
  };

  const handleAddLineItem = () => {
    setFormLineItems([
      ...formLineItems,
      { description: "", quantity: 1, unit_price: 0, amount: 0 },
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

  const totalCalculatedBDT = formLineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

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
          setFormContactName("");
          setFormWhatsapp("");
          setFormNotes("");
          setFormLineItems([{ description: "", quantity: 1, unit_price: 0, amount: 0 }]);
        },
      }
    );
  };

  const bookingList = bookings?.data || bookings || [];

  return (
    <AuthenticatedLayout>
      <Head title="Bookings & Orders - Nefco Books" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
              <span>Orders & Bookings</span>
            </h1>
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
                    No bookings found. Click <strong>+ New Booking</strong> to create one.
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
                      list="customer-contacts-list"
                      value={formContactName}
                      onChange={(e) => handleSelectContact(e.target.value)}
                      placeholder="Select or type customer..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    />
                    <datalist id="customer-contacts-list">
                      {contactList.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">WhatsApp Number *</label>
                    <input
                      type="text"
                      required
                      value={formWhatsapp}
                      onChange={(e) => setFormWhatsapp(e.target.value)}
                      placeholder="+88017..."
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

                {/* Line items */}
                <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold text-slate-800">Booking Services / Line Items</h3>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      + Add Item
                    </button>
                  </div>

                  {formLineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-md border border-slate-200">
                      <div className="col-span-6">
                        <input
                          type="text"
                          required
                          placeholder="Service / Goods Description"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                          className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(idx, "quantity", e.target.value)}
                          className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleLineItemChange(idx, "unit_price", e.target.value)}
                          className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded text-right"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-2 font-bold text-xs text-slate-800">
                    <span>Estimated Total (BDT):</span>
                    <span className="text-blue-600">{formatBDT(totalCalculatedBDT)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Special Notes</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Customer requests or delivery notes..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-xs"
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
