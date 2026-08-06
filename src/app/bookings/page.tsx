"use client";

import { useState, useEffect } from "react";
import { formatBDT } from "@/lib/utils";
import { Plus, Search, CalendarCheck, FileText, CheckCircle2, Clock, XCircle, X, Trash2, ArrowRight } from "lucide-react";

interface BookingLineItem {
  id?: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Booking {
  id: string;
  bookingNumber: string;
  contact: {
    id: string;
    name: string;
    companyName?: string;
    whatsappNumber: string;
  };
  bookingDate: string;
  serviceDate?: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  notes?: string;
  totalAmount: number;
  lineItems: BookingLineItem[];
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form State
  const [formContactName, setFormContactName] = useState("Rahim Chowdhury");
  const [formWhatsapp, setFormWhatsapp] = useState("+8801711223344");
  const [formServiceDate, setFormServiceDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formLineItems, setFormLineItems] = useState<BookingLineItem[]>([
    { description: "Web Application Development", quantity: 1, unitPrice: 75000, amount: 75000 },
  ]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?search=${encodeURIComponent(search)}&status=${statusFilter}`);
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [search, statusFilter]);

  const updateBookingStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchBookings();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleAddLineItem = () => {
    setFormLineItems([
      ...formLineItems,
      { description: "Custom Service / Item", quantity: 1, unitPrice: 0, amount: 0 },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setFormLineItems(formLineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: keyof BookingLineItem, val: any) => {
    const updated = [...formLineItems];
    const item = { ...updated[index], [field]: val };
    if (field === "quantity" || field === "unitPrice") {
      item.amount = (parseFloat(item.quantity as any) || 0) * (parseFloat(item.unitPrice as any) || 0);
    }
    updated[index] = item;
    setFormLineItems(updated);
  };

  const totalCalculatedBDT = formLineItems.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: formContactName,
          whatsappNumber: formWhatsapp,
          serviceDate: formServiceDate,
          notes: formNotes,
          lineItems: formLineItems,
        }),
      });
      if (res.ok) {
        setIsDrawerOpen(false);
        fetchBookings();
      }
    } catch (err) {
      console.error("Failed to create booking", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Order & Booking Management</h1>
          <p className="text-xs text-slate-500">Track service orders and convert confirmed bookings to BDT invoices</p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Order / Booking</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking # or contact..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" ? "All Bookings" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
            <tr>
              <th className="py-3 px-4">Booking Number</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Service Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Total Amount (BDT)</th>
              <th className="py-3 px-4 text-center">Actions / 1-Click Convert</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Loading bookings...
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No bookings found. Click "New Order / Booking" to create one.
                </td>
              </tr>
            ) : (
              bookings.map((bkg) => (
                <tr key={bkg.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    {bkg.bookingNumber}
                    <div className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                      {new Date(bkg.bookingDate).toLocaleDateString("en-BD")}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{bkg.contact.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{bkg.contact.whatsappNumber}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {bkg.serviceDate ? new Date(bkg.serviceDate).toLocaleDateString("en-BD") : "TBD"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full inline-flex items-center gap-1 ${
                        bkg.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : bkg.status === "PENDING"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : bkg.status === "COMPLETED"
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : "bg-slate-100 text-slate-600 border border-slate-300"
                      }`}
                    >
                      {bkg.status === "CONFIRMED" && <CheckCircle2 className="h-3 w-3" />}
                      {bkg.status === "PENDING" && <Clock className="h-3 w-3" />}
                      {bkg.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatBDT(bkg.totalAmount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {bkg.status === "PENDING" && (
                        <button
                          onClick={() => updateBookingStatus(bkg.id, "CONFIRMED")}
                          className="px-2 py-1 text-[11px] font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                        >
                          Confirm
                        </button>
                      )}

                      {bkg.status === "CONFIRMED" && (
                        <a
                          href={`/sales/invoices?convertBookingId=${bkg.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-xs"
                        >
                          <FileText className="h-3 w-3" />
                          <span>1-Click Convert to Invoice</span>
                        </a>
                      )}

                      {bkg.status === "COMPLETED" && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Invoiced & Done
                        </span>
                      )}
                    </div>
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
                        className="w-16 px-2 py-1 text-xs border border-slate-300 rounded bg-white font-semibold"
                      />
                      <input
                        type="number"
                        placeholder="Rate (BDT)"
                        value={item.unitPrice}
                        onChange={(e) => handleLineItemChange(index, "unitPrice", e.target.value)}
                        className="w-24 px-2 py-1 text-xs border border-slate-300 rounded bg-white font-bold"
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
  );
}
