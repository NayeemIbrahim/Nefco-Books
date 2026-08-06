"use client";

import { useState, useEffect } from "react";
import { formatBDT } from "@/lib/utils";
import { Plus, Search, MessageSquare, Phone, Mail, Building, X, UserCheck } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  whatsappNumber: string;
  type: "CUSTOMER" | "VENDOR" | "BOTH";
  address?: string;
  city?: string;
  currentBalance: number;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // New Contact Form State
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    whatsappNumber: "+8801700000000",
    type: "CUSTOMER",
    address: "",
    city: "Dhaka",
  });

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts?search=${encodeURIComponent(search)}&type=${typeFilter}`);
      const data = await res.json();
      setContacts(data);
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [search, typeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsDrawerOpen(false);
        setFormData({
          name: "",
          companyName: "",
          email: "",
          phone: "",
          whatsappNumber: "+8801700000000",
          type: "CUSTOMER",
          address: "",
          city: "Dhaka",
        });
        fetchContacts();
      }
    } catch (err) {
      console.error("Failed to save contact", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Contacts (CRM)</h1>
          <p className="text-xs text-slate-500">Manage Customers, Vendors, and WhatsApp Communication</p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Contact</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, or WhatsApp..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["ALL", "CUSTOMER", "VENDOR", "BOTH"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                typeFilter === type
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type === "ALL" ? "All Contacts" : type}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
            <tr>
              <th className="py-3 px-4">Contact Name</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">WhatsApp / Phone</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4 text-right">Receivable / Payable (BDT)</th>
              <th className="py-3 px-4 text-center">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Loading contacts...
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No contacts found. Click "New Contact" to create one.
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{contact.name}</div>
                    {contact.companyName && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building className="h-3 w-3" /> {contact.companyName}
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
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-emerald-700 font-mono font-medium">
                      <MessageSquare className="h-3.5 w-3.5 fill-emerald-100" />
                      {contact.whatsappNumber}
                    </div>
                    {contact.email && <div className="text-[11px] text-slate-400">{contact.email}</div>}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {contact.city || "Dhaka"}, Bangladesh
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    <span
                      className={
                        contact.currentBalance > 0
                          ? "text-blue-600"
                          : contact.currentBalance < 0
                          ? "text-amber-600"
                          : "text-slate-500"
                      }
                    >
                      {formatBDT(contact.currentBalance)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <a
                      href={`https://wa.me/${contact.whatsappNumber.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition"
                    >
                      <MessageSquare className="h-3 w-3" /> Chat WhatsApp
                    </a>
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
                <h2 className="text-base font-bold text-slate-900">Create New Contact</h2>
                <p className="text-xs text-slate-500">Add Customer or Vendor to CRM</p>
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
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
                  <label className="text-xs font-semibold text-slate-700">WhatsApp Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="+8801700000000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
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

              <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-[11px] text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700">Currency Default: BDT (৳)</div>
                <div>All receivables and payables for this contact will be calculated in Bangladeshi Taka.</div>
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
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
