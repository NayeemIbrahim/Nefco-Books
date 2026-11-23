import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Pagination from "@/Components/Pagination";
import DateField from "@/Components/DateField";
import { formatBDT } from "@/lib/utils";
import {
  Plus, Search, MessageSquare, Building2, Phone, Mail, X, Trash2, RotateCcw,
  AlertCircle, Check, DollarSign, BookOpen, Info, ArrowUpRight, ArrowDownLeft,
  FileText, Loader2, Calendar
} from "lucide-react";
import { Head, router, usePage } from "@inertiajs/react";

export default function ContactsIndex({ contacts, filters }) {
  const { errors, flash } = usePage().props;
  const [search, setSearch] = useState(filters?.search || "");
  const [activeTab, setActiveTab] = useState(filters?.type || "ALL");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [drawerTab, setDrawerTab] = useState("DETAILS"); // "DETAILS" | "LEDGER"
  const [ledgerData, setLedgerData] = useState(null);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    type: "CUSTOMER",
    whatsapp_number: "",
    phone: "",
    email: "",
    address: "",
    city: "Dhaka",
    opening_balance: "",
    opening_balance_type: "TO_RECEIVE",
    opening_balance_date: new Date().toISOString().split("T")[0],
  });

  const fetchLedger = (contactId) => {
    setIsLoadingLedger(true);
    fetch(`/contacts/${contactId}/ledger`)
      .then((res) => res.json())
      .then((data) => {
        setLedgerData(data);
        setIsLoadingLedger(false);
      })
      .catch((err) => {
        console.error("Failed to load ledger:", err);
        setIsLoadingLedger(false);
      });
  };

  const handleOpenCreateDrawer = () => {
    setEditingContact(null);
    setDrawerTab("DETAILS");
    setLedgerData(null);
    setFormData({
      name: "",
      company_name: "",
      type: "CUSTOMER",
      whatsapp_number: "",
      phone: "",
      email: "",
      address: "",
      city: "Dhaka",
      opening_balance: "",
      opening_balance_type: "TO_RECEIVE",
      opening_balance_date: new Date().toISOString().split("T")[0],
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (contact, defaultTab = "DETAILS") => {
    setEditingContact(contact);
    setDrawerTab(defaultTab);
    const defaultType = contact.type === "VENDOR" ? "TO_PAY" : "TO_RECEIVE";
    setFormData({
      name: contact.name || "",
      company_name: contact.company_name || "",
      type: contact.type || "CUSTOMER",
      whatsapp_number: contact.whatsapp_number || "",
      phone: contact.phone || contact.whatsapp_number || "",
      email: contact.email || "",
      address: contact.address || "",
      city: contact.city || "Dhaka",
      opening_balance: contact.opening_balance ? parseFloat(contact.opening_balance) : "",
      opening_balance_type: contact.opening_balance_type || defaultType,
      opening_balance_date: contact.opening_balance_date
        ? contact.opening_balance_date.split("T")[0]
        : (contact.created_at ? contact.created_at.split("T")[0] : new Date().toISOString().split("T")[0]),
    });
    setIsDrawerOpen(true);

    if (defaultTab === "LEDGER") {
      fetchLedger(contact.id);
    } else {
      setLedgerData(null);
    }
  };

  const handleTypeChange = (newType) => {
    const newObType = newType === "VENDOR" ? "TO_PAY" : "TO_RECEIVE";
    setFormData({
      ...formData,
      type: newType,
      opening_balance_type: !formData.opening_balance ? newObType : formData.opening_balance_type,
    });
  };

  const handleFilter = (type) => {
    setActiveTab(type);
    router.get("/contacts", { search, type }, { preserveState: true, replace: true });
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    router.get("/contacts", { search: val, type: activeTab }, { preserveState: true, replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get("/contacts", { search, type: activeTab }, { preserveState: true, replace: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      whatsapp_number: formData.whatsapp_number ? formData.whatsapp_number.trim() : "",
      phone: formData.phone ? formData.phone.trim() : (formData.whatsapp_number ? formData.whatsapp_number.trim() : ""),
      email: formData.email ? formData.email.trim() : null,
      opening_balance: formData.opening_balance ? parseFloat(formData.opening_balance) : 0,
      opening_balance_type: formData.opening_balance_type || (formData.type === "VENDOR" ? "TO_PAY" : "TO_RECEIVE"),
      opening_balance_date: formData.opening_balance_date || new Date().toISOString().split("T")[0],
    };

    if (editingContact) {
      router.post(`/contacts/${editingContact.id}`, payload, {
        preserveScroll: true,
        onSuccess: () => {
          setIsDrawerOpen(false);
          setEditingContact(null);
        },
      });
    } else {
      router.post("/contacts", payload, {
        preserveScroll: true,
        onSuccess: () => {
          setIsDrawerOpen(false);
        },
      });
    }
  };

  const handleDelete = (contact, e) => {
    if (e) e.stopPropagation();
    if (
      confirm(
        `Are you sure you want to delete "${contact.name}"?\n\nNote: If this contact has any invoices, bills, bookings, or ledger history, it will be safely hidden instead of deleted to protect accounting integrity.`
      )
    ) {
      router.delete(`/contacts/${contact.id}`, {
        onSuccess: () => {
          setIsDrawerOpen(false);
          setEditingContact(null);
        },
      });
    }
  };

  const handleRestore = (contact, e) => {
    if (e) e.stopPropagation();
    router.post(`/contacts/${contact.id}/restore`, {}, {
      preserveScroll: true,
    });
  };

  const contactList = contacts?.data || contacts || [];

  return (
    <AuthenticatedLayout>
      <Head title="Contacts (CRM) - Nefco Books" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Contacts & Directory</h1>
            <p className="text-xs text-slate-500">Manage customers, vendors, and WhatsApp integration</p>
          </div>
          <button
            onClick={handleOpenCreateDrawer}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Contact</span>
          </button>
        </div>

        {/* Global Notifications */}
        {flash?.error && (
          <div className="p-3.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 shadow-xs">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span className="font-semibold">{flash.error}</span>
          </div>
        )}
        {flash?.success && (
          <div className="p-3.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-2 shadow-xs">
            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{flash.success}</span>
          </div>
        )}
        {flash?.info && (
          <div className="p-3.5 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center gap-2 shadow-xs">
            <AlertCircle className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="font-semibold">{flash.info}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            {[
              { id: "ALL", label: "All Contacts" },
              { id: "CUSTOMER", label: "Customers" },
              { id: "VENDOR", label: "Vendors" },
              { id: "HIDDEN", label: "Archived / Hidden" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeTab === tab.id
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
              placeholder="Search by name, company, WhatsApp..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </form>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
              <tr>
                <th className="py-3 px-4">Contact Name & Company</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">WhatsApp / Phone</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Current Balance (BDT)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contactList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No contacts found. Click "New Contact" to create one.
                  </td>
                </tr>
              ) : (
                contactList.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => handleOpenEditDrawer(contact)}
                    className="hover:bg-blue-50/50 cursor-pointer transition"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-600 hover:underline">{contact.name}</span>
                        {contact.is_hidden && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 rounded">
                            ARCHIVED
                          </span>
                        )}
                      </div>
                      {contact.company_name && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" />
                          <span>{contact.company_name}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          contact.type === "CUSTOMER"
                            ? "bg-blue-100 text-blue-800"
                            : contact.type === "VENDOR"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {contact.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{contact.whatsapp_number}</span>
                      </div>
                      {contact.email && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {contact.city || "Dhaka"}, {contact.country || "Bangladesh"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      <span
                        className={
                          parseFloat(contact.current_balance) > 0
                            ? "text-blue-600"
                            : parseFloat(contact.current_balance) < 0
                            ? "text-amber-600"
                            : "text-slate-500"
                        }
                      >
                        {formatBDT(contact.current_balance)}
                      </span>
                      {parseFloat(contact.opening_balance) > 0 && (
                        <div className="text-[10px] font-normal text-slate-400 mt-0.5 flex items-center justify-end gap-1">
                          <span>OB: {formatBDT(contact.opening_balance)}</span>
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] font-semibold ${
                              contact.opening_balance_type === "TO_PAY"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {contact.opening_balance_type === "TO_PAY" ? "To Pay" : "To Receive"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditDrawer(contact, "LEDGER")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded hover:bg-slate-200 transition"
                          title="View Contact Ledger / Statement"
                        >
                          <BookOpen className="h-3 w-3 text-slate-500" />
                          <span>Ledger</span>
                        </button>

                        <a
                          href={`https://wa.me/${(contact.whatsapp_number || "").replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>WhatsApp</span>
                        </a>

                        {contact.is_hidden ? (
                          <button
                            type="button"
                            onClick={(e) => handleRestore(contact, e)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition"
                            title="Restore to active contacts"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Restore</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(contact, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Delete or Hide Contact"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 15-Row Pagination */}
          <Pagination meta={contacts} />
        </div>

        {/* Slide-out Form Drawer (Zoho style) */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
            <div className={`w-full ${drawerTab === "LEDGER" ? "max-w-3xl lg:max-w-4xl" : "max-w-xl"} bg-white h-full shadow-2xl flex flex-col justify-between transition-all duration-200`}>
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {editingContact ? `Contact: ${editingContact.name}` : "Create New Contact"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {editingContact
                        ? "Manage customer / vendor details, opening balance, and ledger"
                        : "Add customer or vendor to CRM with Zoho Books-style Opening Balance"}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {editingContact && (
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDrawerTab("DETAILS")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                        drawerTab === "DETAILS"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Contact Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerTab("LEDGER");
                        fetchLedger(editingContact.id);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                        drawerTab === "LEDGER"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Statement & Ledger</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Drawer Body */}
              {drawerTab === "LEDGER" && editingContact ? (
                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <span className="text-[11px] font-medium text-slate-500 block">Current Balance</span>
                      <span
                        className={`text-base font-bold ${
                          parseFloat(editingContact.current_balance) > 0
                            ? "text-blue-600"
                            : parseFloat(editingContact.current_balance) < 0
                            ? "text-amber-600"
                            : "text-slate-800"
                        }`}
                      >
                        {formatBDT(editingContact.current_balance)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {editingContact.type === "VENDOR"
                          ? (parseFloat(editingContact.current_balance) >= 0 ? "Payable Due" : "Advance Paid")
                          : (parseFloat(editingContact.current_balance) >= 0 ? "Receivable Due" : "Customer Credit")}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <span className="text-[11px] font-medium text-slate-500 block">Opening Balance</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-base font-bold text-slate-800">
                          {formatBDT(editingContact.opening_balance || 0)}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            editingContact.opening_balance_type === "TO_PAY"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {editingContact.opening_balance_type === "TO_PAY" ? "To Pay" : "To Receive"}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        As of: {editingContact.opening_balance_date || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Ledger Statement Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span>Transaction Ledger Statement</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => fetchLedger(editingContact.id)}
                        className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Refresh</span>
                      </button>
                    </div>

                    {isLoadingLedger ? (
                      <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="text-xs">Loading ledger entries...</span>
                      </div>
                    ) : !ledgerData?.entries || ledgerData.entries.length === 0 ? (
                      <div className="py-10 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-xs">
                        No ledger transactions recorded for this contact yet.
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[60vh] overflow-y-auto shadow-inner">
                        <table className="w-full min-w-[650px] text-[11px] text-left text-slate-600">
                          <thead className="bg-slate-100 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500 sticky top-0 z-10 shadow-xs">
                            <tr>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Type / Ref</th>
                              <th className="py-2.5 px-3 text-right">Debit (৳)</th>
                              <th className="py-2.5 px-3 text-right">Credit (৳)</th>
                              <th className="py-2.5 px-3 text-right">Balance (৳)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {ledgerData.entries.map((entry) => (
                              <tr key={entry.id} className="hover:bg-slate-50 transition">
                                <td className="py-2 px-3 whitespace-nowrap font-mono text-[10px] text-slate-500">
                                  {entry.date}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                        entry.type === "OPENING_BALANCE"
                                          ? "bg-purple-100 text-purple-800"
                                          : entry.type === "INVOICE"
                                          ? "bg-blue-100 text-blue-800"
                                          : entry.type === "BILL"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-emerald-100 text-emerald-800"
                                      }`}
                                    >
                                      {entry.type === "OPENING_BALANCE" ? "OPENING BAL" : entry.type}
                                    </span>
                                    <span className="font-semibold text-slate-800 font-mono text-[10px]">
                                      {entry.reference}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                                    {entry.description}
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-700">
                                  {entry.debit > 0 ? formatBDT(entry.debit) : "-"}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-700">
                                  {entry.credit > 0 ? formatBDT(entry.credit) : "-"}
                                </td>
                                <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                                  {formatBDT(entry.running_balance)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
                  {flash?.error && (
                    <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{flash.error}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rahim Chowdhury"
                      className={`w-full px-3 py-2 text-xs border rounded-md ${
                        errors?.name ? "border-rose-500 bg-rose-50/50" : "border-slate-300"
                      } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                    />
                    {errors?.name && (
                      <p className="text-[11px] font-medium text-rose-600 mt-0.5">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Company Name</label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="e.g. Chowdhury Enterprise"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Contact Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="VENDOR">VENDOR</option>
                        <option value="BOTH">BOTH</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">WhatsApp / Phone Number</label>
                      <input
                        type="text"
                        value={formData.whatsapp_number}
                        onChange={(e) =>
                          setFormData({ ...formData, whatsapp_number: e.target.value, phone: e.target.value })
                        }
                        placeholder="e.g. 01700000000 or +8801700000000"
                        className={`w-full px-3 py-2 text-xs border rounded-md font-mono ${
                          errors?.whatsapp_number ? "border-rose-500 bg-rose-50/50" : "border-slate-300"
                        } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                      />
                      {errors?.whatsapp_number && (
                        <p className="text-[11px] font-medium text-rose-600 mt-0.5">{errors.whatsapp_number}</p>
                      )}
                    </div>
                  </div>

                  {/* Zoho Books-style Opening Balance Feature */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <span>Opening Balance (Zoho Books Style)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
                        Offset: Equity 3010
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                      {/* Amount */}
                      <div className="col-span-5 space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Opening Amount (BDT)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                            ৳
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.opening_balance}
                            onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                          />
                        </div>
                      </div>

                      {/* Direction: To Receive / To Pay */}
                      <div className="col-span-4 space-y-1">
                        <label className="text-xs font-semibold text-slate-700">To Receive / To Pay</label>
                        <select
                          value={formData.opening_balance_type}
                          onChange={(e) => setFormData({ ...formData, opening_balance_type: e.target.value })}
                          className="w-full px-2 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                        >
                          <option value="TO_RECEIVE">
                            {formData.type === "VENDOR" ? "To Receive (Dr - Advance)" : "To Receive (Dr - Due)"}
                          </option>
                          <option value="TO_PAY">
                            {formData.type === "CUSTOMER" ? "To Pay (Cr - Credit)" : "To Pay (Cr - Due)"}
                          </option>
                        </select>
                      </div>

                      {/* As of Date */}
                      <div className="col-span-3 space-y-1">
                        <DateField
                          label="As of Date"
                          value={formData.opening_balance_date}
                          onChange={(d) => setFormData({ ...formData, opening_balance_date: d })}
                        />
                      </div>
                    </div>

                    {parseFloat(formData.opening_balance) > 0 && (
                      <div className="text-[11px] bg-blue-50/80 border border-blue-200 rounded p-2 text-blue-900 flex items-start gap-1.5">
                        <Info className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          {formData.opening_balance_type === "TO_RECEIVE" ? (
                            <span>
                              <strong>To Receive:</strong> Debits{" "}
                              <em>{formData.type === "VENDOR" ? "Accounts Payable (2000)" : "Accounts Receivable (1100)"}</em>{" "}
                              and Credits <em>Opening Balance Equity (3010)</em>.
                            </span>
                          ) : (
                            <span>
                              <strong>To Pay:</strong> Debits <em>Opening Balance Equity (3010)</em> and Credits{" "}
                              <em>{formData.type === "CUSTOMER" ? "Accounts Receivable (1100)" : "Accounts Payable (2000)"}</em>.
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="rahim@example.bd"
                      className={`w-full px-3 py-2 text-xs border rounded-md ${
                        errors?.email ? "border-rose-500 bg-rose-50/50" : "border-slate-300"
                      } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                    />
                    {errors?.email && (
                      <p className="text-[11px] font-medium text-rose-600 mt-0.5">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Street Address</label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="House 42, Road 11, Banani"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Dhaka, Chittagong..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Country</label>
                      <input
                        type="text"
                        disabled
                        value="Bangladesh"
                        className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 text-slate-500 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    {editingContact ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(editingContact)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-md transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Contact</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
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
                        Save Contact
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
