import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { Plus, Search, MessageSquare, Building2, Phone, Mail, X, Trash2, RotateCcw } from "lucide-react";
import { Head, router, usePage } from "@inertiajs/react";

export default function ContactsIndex({ contacts, filters }) {
  const { errors, flash } = usePage().props;
  const [search, setSearch] = useState(filters?.search || "");
  const [activeTab, setActiveTab] = useState(filters?.type || "ALL");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    type: "CUSTOMER",
    whatsapp_number: "+8801",
    phone: "",
    email: "",
    address: "",
    city: "",
  });

  const handleOpenCreateDrawer = () => {
    setEditingContact(null);
    setFormData({
      name: "",
      company_name: "",
      type: "CUSTOMER",
      whatsapp_number: "+8801",
      phone: "",
      email: "",
      address: "",
      city: "",
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || "",
      company_name: contact.company_name || "",
      type: contact.type || "CUSTOMER",
      whatsapp_number: contact.whatsapp_number || "+8801",
      phone: contact.phone || contact.whatsapp_number || "",
      email: contact.email || "",
      address: contact.address || "",
      city: contact.city || "",
    });
    setIsDrawerOpen(true);
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
    if (editingContact) {
      router.post(`/contacts/${editingContact.id}`, formData, {
        onSuccess: () => {
          setIsDrawerOpen(false);
          setEditingContact(null);
        },
      });
    } else {
      router.post("/contacts", formData, {
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
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
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
        </div>

        {/* Slide-out Form Drawer (Zoho style) */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingContact ? `Edit Contact: ${editingContact.name}` : "Create New Contact"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingContact ? "Update customer or vendor details" : "Add Customer or Vendor to CRM"}
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
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahim Chowdhury"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
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
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="VENDOR">VENDOR</option>
                      <option value="BOTH">BOTH</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">WhatsApp / Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value, phone: e.target.value })}
                      placeholder="+8801700000000"
                      className={`w-full px-3 py-2 text-xs border rounded-md font-mono ${
                        errors?.whatsapp_number ? "border-rose-500 bg-rose-50/50" : "border-slate-300"
                      } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                    />
                    {errors?.whatsapp_number && (
                      <p className="text-[11px] font-medium text-rose-600 mt-0.5">{errors.whatsapp_number}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rahim@example.bd"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
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
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
