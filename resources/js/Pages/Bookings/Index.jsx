import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DateField from "@/Components/DateField";
import Pagination from "@/Components/Pagination";
import { formatBDT, formatDate } from "@/lib/utils";
import {
  Plus,
  Search,
  CalendarCheck,
  FileText,
  Trash2,
  X,
  Phone,
  Calendar,
  Edit,
  Package,
  CheckCircle2,
  Send,
  Clock,
} from "lucide-react";
import { Head, router } from "@inertiajs/react";

export default function BookingsIndex({ bookings, contacts, items, filters, draft_invoices }) {
  const [activeTab, setActiveTab] = useState("BOOKINGS"); // 'BOOKINGS' | 'DRAFTS'
  const [search, setSearch] = useState(filters?.search || "");
  const [statusFilter, setStatusFilter] = useState(filters?.status || "ALL");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [editingBookingInvoiced, setEditingBookingInvoiced] = useState(false);

  const contactList = contacts || [];
  const itemList = items || [];
  const draftList = draft_invoices || [];

  // Form State
  const [formContactName, setFormContactName] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formOrderNumber, setFormOrderNumber] = useState("");
  const [formInvoiceNumber, setFormInvoiceNumber] = useState("");
  const [formServiceDate, setFormServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");
  const [formAttachments, setFormAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [formLineItems, setFormLineItems] = useState([
    { item_id: null, description: "", quantity: 1, unit_price: 0, amount: 0 },
  ]);

  const resetForm = () => {
    setEditingBookingId(null);
    setEditingBookingInvoiced(false);
    setFormContactName("");
    setFormWhatsapp("");
    setFormOrderNumber("");
    setFormInvoiceNumber("");
    setFormServiceDate(new Date().toISOString().split("T")[0]);
    setFormNotes("");
    setFormAttachments([]);
    setExistingAttachments([]);
    setFormLineItems([{ item_id: null, description: "", quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const handleOpenCreateDrawer = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (bkg) => {
    setEditingBookingId(bkg.id);
    setEditingBookingInvoiced(!!(bkg.invoice_number || bkg.status === "INVOICED" || bkg.status === "COMPLETED"));
    setFormContactName(bkg.contact?.name || "");
    setFormWhatsapp(bkg.contact?.whatsapp_number || bkg.contact?.phone || "");
    setFormOrderNumber(bkg.order_number || "");
    setFormInvoiceNumber(bkg.invoice_number || "");
    setFormServiceDate(bkg.booking_date ? bkg.booking_date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setFormNotes(bkg.notes || "");
    setExistingAttachments(bkg.attachments || []);
    setFormAttachments([]);

    const lines = bkg.line_items || bkg.lineItems || [];
    if (lines.length > 0) {
      setFormLineItems(
        lines.map((l) => ({
          item_id: l.item_id || null,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          amount: l.amount,
        }))
      );
    } else {
      setFormLineItems([{ item_id: null, description: "Booking Service / Product", quantity: 1, unit_price: bkg.total_amount, amount: bkg.total_amount }]);
    }

    setIsDrawerOpen(true);
  };

  const handleDeleteBooking = (bkgId, bkgNum) => {
    if (confirm(`Are you sure you want to delete Quote / Booking ${bkgNum || ""}? This cannot be undone.`)) {
      router.delete(`/bookings/${bkgId}`, {
        onSuccess: () => {
          if (isDrawerOpen) setIsDrawerOpen(false);
        },
      });
    }
  };

  const handleDeleteDraftInvoice = (draftId, invNum) => {
    if (confirm(`Are you sure you want to delete Draft Invoice ${invNum || ""}? This action cannot be undone.`)) {
      router.delete(`/invoices/${draftId}`);
    }
  };

  const handleAcceptAndInvoice = (bkgId) => {
    if (confirm("Accept this Quote / Deal and generate an Invoice? It will post to General Ledger upon issuance.")) {
      router.post(`/bookings/${bkgId}/convert`, {}, {
        onSuccess: () => {
          if (isDrawerOpen) setIsDrawerOpen(false);
        },
      });
    }
  };

  const handleFilter = (st) => {
    setStatusFilter(st);
    router.get("/bookings", { search, status: st }, { preserveState: true, replace: true });
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    router.get("/bookings", { search: val, status: statusFilter }, { preserveState: true, replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get("/bookings", { search, status: statusFilter }, { preserveState: true, replace: true });
  };

  const handleSelectContact = (name) => {
    setFormContactName(name);
    const matched = contactList.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (matched && (matched.whatsapp_number || matched.phone)) {
      setFormWhatsapp(matched.whatsapp_number || matched.phone);
    }
  };

  const handleProductSelect = (index, value) => {
    const matched = itemList.find(
      (it) => it.name.toLowerCase() === value.toLowerCase() || it.sku?.toLowerCase() === value.toLowerCase()
    );
    const updated = [...formLineItems];
    if (matched) {
      const qty = parseFloat(updated[index].quantity) || 1;
      const price = parseFloat(matched.sales_price) || 0;
      updated[index] = {
        ...updated[index],
        item_id: matched.id,
        description: matched.name,
        unit_price: price,
        amount: qty * price,
      };
    } else {
      updated[index] = {
        ...updated[index],
        item_id: null,
        description: value,
      };
    }
    setFormLineItems(updated);
  };

  const handleAddLineItem = () => {
    setFormLineItems([
      ...formLineItems,
      { item_id: null, description: "", quantity: 1, unit_price: 0, amount: 0 },
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

  const totalCalculatedBDT = formLineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formContactName || !formContactName.trim()) {
      alert("Please provide a customer name.");
      return;
    }

    const invalidLine = formLineItems.find((li) => !li.description || !li.description.trim());
    if (invalidLine) {
      alert("Please provide a description for all quote items.");
      return;
    }

    const formData = new FormData();
    formData.append("contact_name", formContactName.trim());
    formData.append("whatsapp_number", formWhatsapp || "");
    if (formOrderNumber) formData.append("order_number", formOrderNumber);
    if (formInvoiceNumber) formData.append("invoice_number", formInvoiceNumber);
    formData.append("booking_date", formServiceDate);
    formData.append("total_amount", totalCalculatedBDT);
    if (formNotes) formData.append("notes", formNotes);

    formLineItems.forEach((li, idx) => {
      if (li.item_id) formData.append(`line_items[${idx}][item_id]`, li.item_id);
      formData.append(`line_items[${idx}][description]`, li.description.trim());
      formData.append(`line_items[${idx}][quantity]`, li.quantity || 1);
      formData.append(`line_items[${idx}][unit_price]`, li.unit_price || 0);
      formData.append(`line_items[${idx}][amount]`, li.amount || 0);
    });

    formAttachments.forEach((f) => {
      formData.append("attachments[]", f);
    });

    const targetUrl = editingBookingId ? `/bookings/${editingBookingId}` : "/bookings";

    router.post(targetUrl, formData, {
      preserveScroll: true,
      onSuccess: () => {
        setIsDrawerOpen(false);
        resetForm();
      },
      onError: (errs) => {
        const msg = Object.values(errs)[0];
        alert(msg || "Could not save quote. Please check the inputs.");
      },
    });
  };

  const bookingList = bookings?.data || bookings || [];

  return (
    <AuthenticatedLayout>
      <Head title="Quotes & Deals (Bookings) - Nefco Books" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
              <span>Quotes & Deals (Bookings)</span>
            </h1>
            <p className="text-xs text-slate-500">
              Manage quotes and deals. Accept to generate invoice, or modify / delete as needed.
            </p>
          </div>
          <button
            onClick={handleOpenCreateDrawer}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Quote / Deal</span>
          </button>
        </div>

        {/* Main Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("BOOKINGS")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
              activeTab === "BOOKINGS"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <CalendarCheck className="h-4 w-4" />
            <span>Quotes & Deals ({bookings?.total ?? bookingList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("DRAFTS")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
              activeTab === "DRAFTS"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Draft Invoices & Orders ({draftList.length})</span>
            {draftList.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black">
                {draftList.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "DRAFTS" ? (
          /* Draft Invoices Table */
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Draft Invoices & Customer Orders</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Draft invoices are stored here before final issuance. Click "Issue & Post" to post directly to General Ledger.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-100/70 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Invoice # & Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Total Amount (BDT)</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {draftList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        No draft invoices pending. Create an invoice with status "DRAFT" in Sales to stage it here.
                      </td>
                    </tr>
                  ) : (
                    draftList.map((draft) => (
                      <tr key={draft.id} className="hover:bg-blue-50/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-blue-600">{draft.invoice_number}</div>
                          {draft.order_number && (
                            <div className="text-[10px] text-slate-400 font-mono">Ord: {draft.order_number}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{draft.contact?.name || "Customer"}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {draft.contact?.whatsapp_number || draft.contact?.phone}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{formatDate(draft.issue_date)}</div>
                          <div className="text-[10px] text-slate-400">Due: {formatDate(draft.due_date)}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {(draft.line_items || draft.lineItems || []).map((li) => li.description).join(", ") || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-300">
                            DRAFT
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatBDT(draft.total_amount)}
                        </td>
                        <td className="py-3 px-4 text-center space-x-1.5">
                          <button
                            onClick={() => router.post(`/invoices/${draft.id}/issue`)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition shadow-xs"
                            title="Issue invoice and post to General Ledger"
                          >
                            <Send className="h-3 w-3" />
                            <span>Issue & Post</span>
                          </button>
                          <button
                            onClick={() => router.get(`/invoices?search=${draft.invoice_number}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                          >
                            <span>Open</span>
                          </button>
                          <button
                            onClick={() => handleDeleteDraftInvoice(draft.id, draft.invoice_number)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded transition border border-red-200"
                            title="Delete Draft Invoice"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            {[
              { id: "ALL", label: "All Quotes & Deals" },
              { id: "QUOTES", label: "Open Quotes" },
              { id: "INVOICED", label: "Invoiced Deals" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white font-semibold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer, quote #, order #..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full min-w-[700px] text-xs text-left text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
              <tr>
                <th className="py-3 px-4">Quote / Deal #</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status / Stage</th>
                <th className="py-3 px-4 text-right">Total Amount (BDT)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookingList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No quotes or deals found. Click <strong>+ New Quote / Deal</strong> to create one.
                  </td>
                </tr>
              ) : (
                bookingList.map((bkg) => {
                  const isInvoiced = !!(bkg.invoice_number || bkg.status === "INVOICED" || bkg.status === "COMPLETED");
                  return (
                    <tr
                      key={bkg.id}
                      onClick={() => handleOpenEditDrawer(bkg)}
                      className="hover:bg-slate-50/70 cursor-pointer transition"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-blue-600">{bkg.booking_number}</div>
                        {bkg.order_number && (
                          <div className="text-[11px] text-slate-400 font-mono">Ord: {bkg.order_number}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {bkg.invoice_number ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {bkg.invoice_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Not Invoiced</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{bkg.contact?.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {bkg.contact?.whatsapp_number || bkg.contact?.phone}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(bkg.booking_date)}
                      </td>
                      <td className="py-3 px-4">
                        {isInvoiced ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>INVOICED</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>OPEN QUOTE</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatBDT(bkg.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {!isInvoiced && (
                            <button
                              type="button"
                              onClick={() => handleAcceptAndInvoice(bkg.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition shadow-xs"
                              title="Accept Deal and generate Invoice"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Accept & Invoice</span>
                            </button>
                          )}
                          {isInvoiced && (
                            <button
                              type="button"
                              onClick={() => router.get(`/invoices?search=${bkg.invoice_number}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                              title="Open Invoice"
                            >
                              <span>View Invoice</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEditDrawer(bkg)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                            title="Edit Quote / Deal"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBooking(bkg.id, bkg.booking_number)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete Quote / Deal"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* 15-Row Pagination */}
          <Pagination meta={bookings} />
        </div>
        </>
        )}

        {/* Drawer Form */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingBookingId ? "Edit Quote / Deal" : "New Quote / Deal"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Prepare quotation or customer deal. Accept to generate an invoice.
                  </p>
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Order Number</label>
                    <input
                      type="text"
                      value={formOrderNumber}
                      onChange={(e) => setFormOrderNumber(e.target.value)}
                      placeholder="e.g. ORD-2026-0001 (Auto if empty)"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <DateField
                      label="Quote / Deal Date"
                      value={formServiceDate}
                      onChange={setFormServiceDate}
                    />
                  </div>
                </div>

                {/* Line items with product auto-fill */}
                <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Package className="h-4 w-4 text-blue-600" />
                      <span>Quote / Deal Items</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      + Add Item
                    </button>
                  </div>

                  {/* Product Datalist */}
                  <datalist id="catalog-products-list">
                    {itemList.map((it) => (
                      <option key={it.id} value={it.name}>
                        {it.sku ? `[${it.sku}] ` : ""}{formatBDT(it.sales_price)} / {it.unit}
                      </option>
                    ))}
                  </datalist>

                  {/* Table Header for Line Items */}
                  <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-slate-500 px-2 py-1 bg-slate-100 rounded">
                    <div className="col-span-6">Item Details</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-3 text-right">Rate</div>
                    <div className="col-span-1 text-center">Amount</div>
                  </div>

                  {formLineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-md border border-slate-200">
                      <div className="col-span-6">
                        <input
                          type="text"
                          required
                          list="catalog-products-list"
                          placeholder="Type or select catalog product..."
                          value={item.description}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
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
                    <span>Quote Total (BDT):</span>
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

                {/* Attach File(s) */}
                <div className="border border-dashed border-slate-300 rounded-lg p-3.5 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-800">Attach File(s)</label>
                      <p className="text-[11px] text-slate-500">Attach quotation, specifications, or agreement documents (Max 10 files, 10 MB each)</p>
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

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  {editingBookingId ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteBooking(editingBookingId, formOrderNumber)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Quote</span>
                    </button>
                  ) : (
                    <div />
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    {editingBookingId && !editingBookingInvoiced && (
                      <button
                        type="button"
                        onClick={() => handleAcceptAndInvoice(editingBookingId)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Accept & Invoice</span>
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-xs transition"
                    >
                      {editingBookingId ? "Save Changes" : "Save Quote / Deal"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
