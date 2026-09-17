import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { Plus, Search, MessageCircle, Building2, Phone, Mail } from "lucide-react";
import { Head, router } from "@inertiajs/react";

export default function ContactsIndex({ contacts, filters }) {
  const [search, setSearch] = useState(filters?.search || "");
  const [activeTab, setActiveTab] = useState(filters?.type || "ALL");

  const handleFilter = (type) => {
    setActiveTab(type);
    router.get("/contacts", { search, type }, { preserveState: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get("/contacts", { search, type: activeTab }, { preserveState: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Contacts (CRM) - Nefco Books" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Contacts & Directory</h1>
            <p className="text-xs text-slate-500">Manage customers, vendors, and automated WhatsApp communication</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-xs transition">
            <Plus className="h-4 w-4" />
            <span>New Contact</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {["ALL", "CUSTOMER", "VENDOR"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeTab === tab
                    ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 border border-transparent"
                }`}
              >
                {tab === "ALL" ? "All Contacts" : tab === "CUSTOMER" ? "Customers" : "Vendors"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, company, WhatsApp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </form>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">WhatsApp / Phone</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts?.data?.length > 0 ? (
                contacts.data.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50/75 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>{contact.name}</div>
                      {contact.company_name && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span>{contact.company_name}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        contact.type === "CUSTOMER"
                          ? "bg-blue-50 text-blue-700"
                          : contact.type === "VENDOR"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-purple-50 text-purple-700"
                      }`}>
                        {contact.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{contact.whatsapp_number}</span>
                      </div>
                      {contact.email && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {contact.city || "Dhaka"}, {contact.country || "Bangladesh"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                      {formatBDT(contact.current_balance)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`https://wa.me/${contact.whatsapp_number.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-semibold border border-emerald-200 transition"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Chat WhatsApp</span>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No contacts found. Click "New Contact" to record a customer or vendor.
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
