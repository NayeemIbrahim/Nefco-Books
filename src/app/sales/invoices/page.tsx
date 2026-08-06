"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { formatBDT } from "@/lib/utils";
import {
  Plus,
  Search,
  FileText,
  MessageSquare,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  X,
  Send,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  contact: {
    id: string;
    name: string;
    whatsappNumber: string;
    email?: string;
    address?: string;
  };
  issueDate: string;
  dueDate: string;
  status: "DRAFT" | "SENT" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "CANCELLED";
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  lineItems: InvoiceLineItem[];
  whatsappSent?: boolean;
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading invoices...</div>}>
      <InvoicesContent />
    </Suspense>
  );
}

function InvoicesContent() {
  const searchParams = useSearchParams();
  const convertBookingId = searchParams.get("convertBookingId");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Drawer / Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [formContactName, setFormContactName] = useState("Rahim Chowdhury");
  const [formWhatsapp, setFormWhatsapp] = useState("+8801711223344");
  const [formIssueDate, setFormIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDueDate, setFormDueDate] = useState(
    new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0]
  );
  const [formNotes, setFormNotes] = useState("Thank you for your business!");
  const [formTax, setFormTax] = useState(0);
  const [formDiscount, setFormDiscount] = useState(0);
  const [formLineItems, setFormLineItems] = useState<InvoiceLineItem[]>([
    { description: "Web Application Development", quantity: 1, unitPrice: 75000, amount: 75000 },
  ]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/invoices?search=${encodeURIComponent(search)}&status=${statusFilter}`
      );
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, statusFilter]);

  // Handle 1-Click Conversion from query params
  useEffect(() => {
    if (convertBookingId) {
      handleConvertBooking(convertBookingId);
    }
  }, [convertBookingId]);

  const handleConvertBooking = async (bkgId: string) => {
    try {
      const res = await fetch("/api/invoices/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bkgId }),
      });
      const data = await res.json();
      if (res.ok && data.invoice) {
        setNotification(
          `🎉 Booking converted! Invoice ${data.invoice.invoiceNumber} created and posted to double-entry ledger.`
        );
        fetchInvoices();
      }
    } catch (err) {
      console.error("Conversion failed", err);
    }
  };

  const handleSendWhatsApp = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send-whatsapp`, {
        method: "POST",
      });
      if (res.ok) {
        setNotification("💬 WhatsApp notification dispatched to customer!");
        setInvoices(
          invoices.map((inv) => (inv.id === invoiceId ? { ...inv, whatsappSent: true } : inv))
        );
      }
    } catch (err) {
      console.error("Failed to dispatch WhatsApp", err);
    }
  };

  const handleAddLineItem = () => {
    setFormLineItems([
      ...formLineItems,
      { description: "Custom Service / Goods", quantity: 1, unitPrice: 0, amount: 0 },
    ]);
  };

  const handleRemoveLineItem = (idx: number) => {
    setFormLineItems(formLineItems.filter((_, i) => i !== idx));
  };

  const handleLineItemChange = (idx: number, field: keyof InvoiceLineItem, val: any) => {
    const updated = [...formLineItems];
    const item = { ...updated[idx], [field]: val };
    if (field === "quantity" || field === "unitPrice") {
      item.amount = (parseFloat(item.quantity as any) || 0) * (parseFloat(item.unitPrice as any) || 0);
    }
    updated[idx] = item;
    setFormLineItems(updated);
  };

  const subtotalBDT = formLineItems.reduce((sum, item) => sum + item.amount, 0);
  const totalBDT = subtotalBDT + parseFloat(formTax as any || 0) - parseFloat(formDiscount as any || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: formContactName,
          whatsappNumber: formWhatsapp,
          issueDate: formIssueDate,
          dueDate: formDueDate,
          subtotal: subtotalBDT,
          taxAmount: parseFloat(formTax as any || 0),
          discountAmount: parseFloat(formDiscount as any || 0),
          notes: formNotes,
          lineItems: formLineItems,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsDrawerOpen(false);
        setNotification(
          `✅ Invoice ${data.invoice.invoiceNumber} issued! WhatsApp notification sent.`
        );
        fetchInvoices();
      }
    } catch (err) {
      console.error("Failed to create invoice", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if notification active */}
      {notification && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Invoices & Sales Ledger</h1>
          <p className="text-xs text-slate-500">
            Issue BDT invoices, post journal entries to ledger, and trigger Meta WhatsApp alerts
          </p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice # or customer..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["ALL", "DRAFT", "SENT", "PAID", "OVERDUE"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" ? "All Invoices" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Issue / Due Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Total Amount (BDT)</th>
              <th className="py-3 px-4 text-center">WhatsApp Alert</th>
              <th className="py-3 px-4 text-center">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No invoices found. Click "New Invoice" to create one.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{inv.contact.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {inv.contact.whatsappNumber}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{new Date(inv.issueDate).toLocaleDateString("en-BD")}</div>
                    <div className="text-[10px] text-slate-400">
                      Due: {new Date(inv.dueDate).toLocaleDateString("en-BD")}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full inline-flex items-center gap-1 ${
                        inv.status === "SENT"
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : inv.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : inv.status === "OVERDUE"
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : "bg-slate-100 text-slate-700 border border-slate-300"
                      }`}
                    >
                      {inv.status === "PAID" && <CheckCircle2 className="h-3 w-3" />}
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatBDT(inv.totalAmount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleSendWhatsApp(inv.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded border transition ${
                        inv.whatsappSent
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                      }`}
                    >
                      <MessageSquare className="h-3 w-3" />
                      {inv.whatsappSent ? "Sent ✓" : "Send Alert"}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                    >
                      View Invoice
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Invoice Form Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">Create Sales Invoice</h2>
                <p className="text-xs text-slate-500">Generates BDT invoice & posts to AR ledger</p>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Issue Date</label>
                  <input
                    type="date"
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Invoice Items (BDT)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {formLineItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-200">
                      <input
                        type="text"
                        placeholder="Item Description..."
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, "quantity", e.target.value)}
                        className="w-14 px-2 py-1 text-xs border border-slate-300 rounded bg-white font-semibold"
                      />
                      <input
                        type="number"
                        placeholder="Rate"
                        value={item.unitPrice}
                        onChange={(e) => handleLineItemChange(index, "unitPrice", e.target.value)}
                        className="w-24 px-2 py-1 text-xs border border-slate-300 rounded bg-white font-bold"
                      />
                      <div className="w-24 text-right font-bold text-xs text-slate-900">
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
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tax / VAT Amount (BDT)</label>
                  <input
                    type="number"
                    value={formTax}
                    onChange={(e) => setFormTax(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Discount (BDT)</label>
                  <input
                    type="number"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md text-amber-700"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Total Invoice Payable</span>
                <span className="text-base text-blue-700">{formatBDT(totalBDT)}</span>
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
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-xs flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Issue & Dispatch WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Printable View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <span className="font-bold text-sm">Invoice View - {selectedInvoice.invoiceNumber}</span>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Invoice Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">INVOICE</h2>
                  <div className="text-xs font-bold text-blue-600 mt-1">Nefco Books</div>
                  <div className="text-[11px] text-slate-400">Dhaka, Bangladesh</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-mono text-sm font-bold text-blue-600">
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Issue Date: {new Date(selectedInvoice.issueDate).toLocaleDateString("en-BD")}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString("en-BD")}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="font-bold text-[10px] uppercase text-slate-400">Billed To:</span>
                  <div className="font-bold text-slate-900 text-sm mt-1">
                    {selectedInvoice.contact.name}
                  </div>
                  <div className="text-slate-500 text-xs">
                    {selectedInvoice.contact.address || "Dhaka, Bangladesh"}
                  </div>
                  <div className="text-emerald-700 font-mono text-[11px] mt-1 font-semibold">
                    WhatsApp: {selectedInvoice.contact.whatsappNumber}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-[10px] uppercase text-slate-400">Status & Ledger:</span>
                  <div className="mt-1">
                    <span className="px-3 py-1 font-bold text-xs bg-blue-100 text-blue-800 rounded-full">
                      {selectedInvoice.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2">
                    Ledger Entry: Debit 1100 AR / Credit 4000 Sales
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 font-bold uppercase text-[10px] text-slate-600">
                  <tr>
                    <th className="p-2 border border-slate-200">Description</th>
                    <th className="p-2 border border-slate-200 text-center">Qty</th>
                    <th className="p-2 border border-slate-200 text-right">Unit Price (BDT)</th>
                    <th className="p-2 border border-slate-200 text-right">Amount (BDT)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.lineItems.map((li, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border border-slate-200 font-medium text-slate-800">
                        {li.description}
                      </td>
                      <td className="p-2 border border-slate-200 text-center font-mono">{li.quantity}</td>
                      <td className="p-2 border border-slate-200 text-right">{formatBDT(li.unitPrice)}</td>
                      <td className="p-2 border border-slate-200 text-right font-bold text-slate-900">
                        {formatBDT(li.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Calculation */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900">{formatBDT(selectedInvoice.subtotal)}</span>
                  </div>
                  {selectedInvoice.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Tax / VAT:</span>
                      <span className="font-semibold text-slate-900">{formatBDT(selectedInvoice.taxAmount)}</span>
                    </div>
                  )}
                  {selectedInvoice.discountAmount > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Discount:</span>
                      <span className="font-semibold">-{formatBDT(selectedInvoice.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
                    <span>Total Amount (BDT):</span>
                    <span className="text-blue-600">{formatBDT(selectedInvoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 border border-slate-300 rounded bg-white shadow-xs"
              >
                <Printer className="h-4 w-4" /> Print / Download PDF
              </button>
              <button
                onClick={() => handleSendWhatsApp(selectedInvoice.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded shadow-xs"
              >
                <MessageSquare className="h-4 w-4" /> Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
