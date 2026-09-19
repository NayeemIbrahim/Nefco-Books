import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import {
  Plus,
  Search,
  FileText,
  MessageSquare,
  CheckCircle2,
  Printer,
  Trash2,
  X,
  Send,
  Edit,
  Paperclip,
} from "lucide-react";
import { Head, router, usePage } from "@inertiajs/react";

export default function InvoicesIndex({ invoices, contacts, items, filters }) {
  const { flash } = usePage().props;
  const [search, setSearch] = useState(filters?.search || "");
  const [statusFilter, setStatusFilter] = useState(filters?.status || "ALL");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [notification, setNotification] = useState(flash?.success || null);

  const contactList = contacts || [];

  // Form State
  const [formContactName, setFormContactName] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formInvoiceNumber, setFormInvoiceNumber] = useState("");
  const [formOrderNumber, setFormOrderNumber] = useState("");
  const [formIssueDate, setFormIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDueDate, setFormDueDate] = useState(
    new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0]
  );
  const [formStatus, setFormStatus] = useState("SENT");
  const [formNotes, setFormNotes] = useState("Thank you for your business!");
  const [formDiscount, setFormDiscount] = useState(0);
  const [formAttachments, setFormAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [formLineItems, setFormLineItems] = useState([
    { description: "", quantity: 1, unit_price: 0, amount: 0 },
  ]);

  const resetForm = () => {
    setEditingInvoiceId(null);
    setFormContactName("");
    setFormWhatsapp("");
    setFormInvoiceNumber("");
    setFormOrderNumber("");
    setFormIssueDate(new Date().toISOString().split("T")[0]);
    setFormDueDate(new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0]);
    setFormStatus("SENT");
    setFormNotes("Thank you for your business!");
    setFormDiscount(0);
    setFormAttachments([]);
    setExistingAttachments([]);
    setFormLineItems([{ description: "", quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const handleOpenCreateDrawer = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (inv) => {
    setEditingInvoiceId(inv.id);
    setFormContactName(inv.contact?.name || "");
    setFormWhatsapp(inv.contact?.whatsapp_number || inv.contact?.phone || "");
    setFormInvoiceNumber(inv.invoice_number || "");
    setFormOrderNumber(inv.order_number || "");
    setFormIssueDate(inv.issue_date ? inv.issue_date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setFormDueDate(inv.due_date ? inv.due_date.split("T")[0] : "");
    setFormStatus(inv.status || "SENT");
    setFormNotes(inv.notes || "");
    setFormDiscount(inv.discount_amount || 0);
    setExistingAttachments(inv.attachments || []);
    setFormAttachments([]);

    const lines = inv.line_items || inv.lineItems || [];
    if (lines.length > 0) {
      setFormLineItems(
        lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          amount: l.amount,
        }))
      );
    } else {
      setFormLineItems([{ description: "Custom Service / Goods", quantity: 1, unit_price: inv.total_amount || 0, amount: inv.total_amount || 0 }]);
    }

    setSelectedInvoice(null);
    setIsDrawerOpen(true);
  };

  const handleSelectContact = (name) => {
    setFormContactName(name);
    const matched = contactList.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (matched && (matched.whatsapp_number || matched.phone)) {
      setFormWhatsapp(matched.whatsapp_number || matched.phone);
    }
  };

  const handleFilter = (st) => {
    setStatusFilter(st);
    router.get("/invoices", { search, status: st }, { preserveState: true, replace: true });
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    router.get("/invoices", { search: val, status: statusFilter }, { preserveState: true, replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get("/invoices", { search, status: statusFilter }, { preserveState: true, replace: true });
  };

  const handleAddLineItem = () => {
    setFormLineItems([
      ...formLineItems,
      { description: "", quantity: 1, unit_price: 0, amount: 0 },
    ]);
  };

  const handleRemoveLineItem = (idx) => {
    if (formLineItems.length <= 1) return;
    setFormLineItems(formLineItems.filter((_, i) => i !== idx));
  };

  const handleLineItemChange = (idx, field, val) => {
    const updated = [...formLineItems];
    const item = { ...updated[idx], [field]: val };
    if (field === "quantity" || field === "unit_price") {
      item.amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    }
    updated[idx] = item;
    setFormLineItems(updated);
  };

  const handleProductSelect = (idx, val) => {
    const matchedItem = (items || []).find(
      (it) => it.name.toLowerCase() === val.toLowerCase() || (it.sku && it.sku.toLowerCase() === val.toLowerCase())
    );
    const updated = [...formLineItems];
    if (matchedItem) {
      const qty = parseFloat(updated[idx].quantity) || 1;
      const rate = parseFloat(matchedItem.sales_price) || 0;
      updated[idx] = {
        ...updated[idx],
        description: matchedItem.name,
        unit_price: rate,
        amount: qty * rate,
      };
    } else {
      updated[idx] = { ...updated[idx], description: val };
    }
    setFormLineItems(updated);
  };

  const handleMarkAsPaid = (invoiceId) => {
    router.post(`/invoices/${invoiceId}/mark-paid`, {}, {
      onSuccess: () => setNotification("✅ Invoice marked as PAID!"),
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formAttachments.length > 10) {
      alert("Maximum 10 files allowed");
      return;
    }
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        alert(`File ${f.name} exceeds maximum 10MB limit.`);
        return;
      }
    }
    setFormAttachments((prev) => [...prev, ...files].slice(0, 10));
  };

  const handleRemoveFile = (idx) => {
    setFormAttachments(formAttachments.filter((_, i) => i !== idx));
  };

  const subtotalBDT = formLineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalBDT = Math.max(0, subtotalBDT - (parseFloat(formDiscount) || 0));

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("contact_name", formContactName);
    formData.append("whatsapp_number", formWhatsapp);
    if (formInvoiceNumber) formData.append("invoice_number", formInvoiceNumber);
    if (formOrderNumber) formData.append("order_number", formOrderNumber);
    formData.append("issue_date", formIssueDate);
    formData.append("due_date", formDueDate);
    formData.append("status", formStatus);
    formData.append("subtotal", subtotalBDT);
    formData.append("discount_amount", parseFloat(formDiscount) || 0);
    formData.append("total_amount", totalBDT);
    if (formNotes) formData.append("notes", formNotes);

    formLineItems.forEach((li, idx) => {
      formData.append(`line_items[${idx}][description]`, li.description);
      formData.append(`line_items[${idx}][quantity]`, li.quantity);
      formData.append(`line_items[${idx}][unit_price]`, li.unit_price);
      formData.append(`line_items[${idx}][amount]`, li.amount);
    });

    formAttachments.forEach((f) => {
      formData.append("attachments[]", f);
    });

    if (editingInvoiceId) {
      router.post(`/invoices/${editingInvoiceId}`, formData, {
        onSuccess: () => {
          setIsDrawerOpen(false);
          resetForm();
          setNotification("✅ Invoice updated successfully!");
        },
      });
    } else {
      router.post("/invoices", formData, {
        onSuccess: () => {
          setIsDrawerOpen(false);
          resetForm();
          setNotification("✅ Invoice issued & posted to general ledger!");
        },
      });
    }
  };

  const handleSendWhatsApp = (invoiceId) => {
    router.post(`/sales/invoices/${invoiceId}/send-whatsapp`, {}, {
      onSuccess: () => setNotification("✅ WhatsApp alert sent successfully!"),
    });
  };

  const invoiceList = invoices?.data || invoices || [];

  return (
    <AuthenticatedLayout>
      <Head title="Invoices & Sales - Nefco Books" />

      <div className="space-y-6">
        {notification && (
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg shadow-xs">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Invoices & Sales</span>
            </h1>
            <p className="text-xs text-slate-500">Generate, edit and manage customer sales invoices in Bangladeshi Taka (৳)</p>
          </div>
          <button
            onClick={handleOpenCreateDrawer}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Invoice</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            {["ALL", "SENT", "PAID", "OVERDUE"].map((st) => (
              <button
                key={st}
                onClick={() => handleFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  statusFilter === st
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search invoice #, order # or customer..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md w-64 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </form>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Amount (BDT)</th>
                <th className="py-3 px-4 text-center">WhatsApp</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoiceList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No invoices found. Click <strong>+ New Invoice</strong> to create one.
                  </td>
                </tr>
              ) : (
                invoiceList.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      <div>{inv.invoice_number}</div>
                      {inv.order_number && (
                        <div className="text-[10px] text-slate-400 font-normal">Ord: {inv.order_number}</div>
                      )}
                      {inv.attachments && inv.attachments.length > 0 && (
                        <div className="text-[10px] text-emerald-600 font-normal flex items-center gap-0.5 mt-0.5">
                          <Paperclip className="h-3 w-3" />
                          <span>{inv.attachments.length} file(s)</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{inv.contact?.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {inv.contact?.whatsapp_number || inv.contact?.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{new Date(inv.issue_date).toLocaleDateString("en-GB")}</div>
                      <div className="text-[10px] text-slate-400">
                        Due: {new Date(inv.due_date).toLocaleDateString("en-GB")}
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
                      {formatBDT(inv.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleSendWhatsApp(inv.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded border transition ${
                          inv.whatsapp_sent
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        }`}
                      >
                        <MessageSquare className="h-3 w-3" />
                        {inv.whatsapp_sent ? "Sent ✓" : "Send Alert"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center space-x-1.5">
                      {inv.status !== "PAID" && (
                        <button
                          onClick={() => handleMarkAsPaid(inv.id)}
                          className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition inline-flex items-center gap-1"
                          title="Record Payment / Mark Paid"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Mark Paid</span>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleOpenEditDrawer(inv)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition inline-flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Invoice Form Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingInvoiceId ? "Edit Invoice" : "Create New Invoice"}
                  </h2>
                  <p className="text-xs text-slate-500">Sales revenue & accounts receivable (BDT ৳)</p>
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
                    <label className="text-xs font-semibold text-slate-700">Invoice Number</label>
                    <input
                      type="text"
                      value={formInvoiceNumber}
                      onChange={(e) => setFormInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-2026-0001 (Auto if empty)"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Order Number</label>
                    <input
                      type="text"
                      value={formOrderNumber}
                      onChange={(e) => setFormOrderNumber(e.target.value)}
                      placeholder="e.g. ORD-2026-0001 (Optional)"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Customer Name *</label>
                    <input
                      type="text"
                      required
                      list="invoice-customer-list"
                      value={formContactName}
                      onChange={(e) => handleSelectContact(e.target.value)}
                      placeholder="Select or type customer..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    />
                    <datalist id="invoice-customer-list">
                      {contactList.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">WhatsApp Number</label>
                    <input
                      type="text"
                      value={formWhatsapp}
                      onChange={(e) => setFormWhatsapp(e.target.value)}
                      placeholder="+88017..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Issue Date *</label>
                    <input
                      type="date"
                      required
                      value={formIssueDate}
                      onChange={(e) => setFormIssueDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    >
                      <option value="SENT">SENT</option>
                      <option value="PAID">PAID</option>
                      <option value="OVERDUE">OVERDUE</option>
                      <option value="DRAFT">DRAFT</option>
                    </select>
                  </div>
                </div>

                {/* Line Items */}
                <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold text-slate-800">Items / Billable Services</h3>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      + Add Item
                    </button>
                  </div>

                  {/* Product Datalist */}
                  <datalist id="invoice-catalog-items">
                    {(items || []).map((it) => (
                      <option key={it.id} value={it.name}>
                        {it.sku ? `[${it.sku}] ` : ""}{formatBDT(it.sales_price)} / {it.unit}
                      </option>
                    ))}
                  </datalist>

                  {/* Table Header for Input Boxes */}
                  <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-slate-500 px-2 py-1 bg-slate-100 rounded">
                    <div className="col-span-5">Item Details</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-right">Rate</div>
                    <div className="col-span-2 text-right">Amount</div>
                    <div className="col-span-1 text-center"></div>
                  </div>

                  {formLineItems.map((li, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-md border border-slate-200">
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          list="invoice-catalog-items"
                          placeholder="Type or select item..."
                          value={li.description}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={li.quantity}
                          onChange={(e) => handleLineItemChange(idx, "quantity", e.target.value)}
                          className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-md text-center font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Rate"
                          value={li.unit_price}
                          onChange={(e) => handleLineItemChange(idx, "unit_price", e.target.value)}
                          className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-md text-right font-mono"
                        />
                      </div>
                      <div className="col-span-2 text-xs font-mono font-bold text-right text-slate-900 pr-1">
                        {formatBDT(li.amount)}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Discount (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Special Notes</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Customer notes or bank payment details..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>

                {/* Attach File(s) */}
                <div className="border border-dashed border-slate-300 rounded-lg p-3.5 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-800">Attach File(s)</label>
                      <p className="text-[11px] text-slate-500">Attach invoice slips, delivery notes, or bills (Max 10 files, 10 MB each)</p>
                    </div>
                    <label className="cursor-pointer px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold shadow-xs">
                      Choose Files
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>

                  {formAttachments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-slate-600">Selected Files to Upload ({formAttachments.length}/10):</div>
                      <div className="flex flex-wrap gap-1.5">
                        {formAttachments.map((f, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded text-[11px]"
                          >
                            <span className="truncate max-w-[140px] font-mono">{f.name}</span>
                            <span className="text-[10px] text-slate-400">({(f.size / (1024 * 1024)).toFixed(1)}MB)</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {existingAttachments.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-200">
                      <div className="text-[11px] font-bold text-slate-600">Existing Attachments:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {existingAttachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:underline rounded text-[11px]"
                          >
                            <span>📎</span>
                            <span className="truncate max-w-[140px] font-mono">{att.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs font-bold text-slate-900">
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
                    <span>{editingInvoiceId ? "Save Invoice Changes" : "Issue & Dispatch Invoice"}</span>
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
                  <span className="font-bold text-sm">Invoice View - {selectedInvoice.invoice_number}</span>
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
                    <div className="text-slate-500 mt-1">Dhaka, Bangladesh</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-slate-900">{selectedInvoice.invoice_number}</div>
                    <div className="text-slate-500 mt-1">
                      Date: {new Date(selectedInvoice.issue_date).toLocaleDateString("en-GB")}
                    </div>
                    <div className="text-slate-500">
                      Due: {new Date(selectedInvoice.due_date).toLocaleDateString("en-GB")}
                    </div>
                    {selectedInvoice.order_number && (
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                        Order #: <strong className="text-slate-700">{selectedInvoice.order_number}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="flex justify-between">
                  <div>
                    <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Billed To</div>
                    <div className="font-semibold text-slate-800 text-sm mt-1">{selectedInvoice.contact?.name}</div>
                    <div className="text-slate-500 font-mono mt-0.5">{selectedInvoice.contact?.whatsapp_number}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Payment Status</div>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-2 px-3 text-left">Description</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedInvoice.line_items || selectedInvoice.lineItems || []).map((li, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-slate-800">{li.description}</td>
                        <td className="py-2 px-3 text-center font-mono">{li.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatBDT(li.unit_price)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{formatBDT(li.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total calculations */}
                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <div className="w-60 space-y-2">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-mono font-bold text-slate-800">{formatBDT(selectedInvoice.subtotal)}</span>
                    </div>
                    {parseFloat(selectedInvoice.discount_amount) > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Discount</span>
                        <span className="font-mono text-red-600">-{formatBDT(selectedInvoice.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 text-sm">
                      <span>Total Amount</span>
                      <span className="font-mono text-blue-600">{formatBDT(selectedInvoice.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-500">
                    <strong>Note:</strong> {selectedInvoice.notes}
                  </div>
                )}

                {selectedInvoice.attachments && selectedInvoice.attachments.length > 0 && (
                  <div className="border-t border-slate-200 pt-3">
                    <div className="font-bold text-[11px] text-slate-700 mb-1.5 flex items-center gap-1">
                      <Paperclip className="h-3.5 w-3.5 text-blue-600" />
                      <span>Attached Documents ({selectedInvoice.attachments.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedInvoice.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-[11px] text-blue-700 hover:bg-slate-200 font-mono transition"
                        >
                          <span>📎</span>
                          <span>{att.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition shadow-xs"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    onClick={() => handleOpenEditDrawer(selectedInvoice)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition shadow-xs"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit Invoice</span>
                  </button>
                </div>

                <button
                  onClick={() => handleSendWhatsApp(selectedInvoice.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition shadow-xs"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
