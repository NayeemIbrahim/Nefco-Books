import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { Plus, Search, MessageCircle, FileText, CheckCircle2 } from "lucide-react";
import { Head, router } from "@inertiajs/react";

export default function InvoicesIndex({ invoices, contacts, items, filters }) {
  const [search, setSearch] = useState(filters?.search || "");
  const [activeStatus, setActiveStatus] = useState(filters?.status || "ALL");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handleFilter = (status) => {
    setActiveStatus(status);
    router.get("/sales/invoices", { search, status }, { preserveState: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get("/sales/invoices", { search, status: activeStatus }, { preserveState: true });
  };

  const handleSendWhatsApp = (invoiceId) => {
    router.post(`/sales/invoices/${invoiceId}/send-whatsapp`, {}, {
      preserveScroll: true,
      onSuccess: () => alert("WhatsApp alert dispatched!"),
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Invoices & Sales - Nefco Books" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales Invoices</h1>
            <p className="text-xs text-slate-500">Manage billing, double-entry revenue posting, and WhatsApp dispatch</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-xs transition">
            <Plus className="h-4 w-4" />
            <span>New Invoice</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {["ALL", "SENT", "PAID", "OVERDUE", "DRAFT"].map((st) => (
              <button
                key={st}
                onClick={() => handleFilter(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeStatus === st
                    ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 border border-transparent"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice number or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </form>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices?.data?.length > 0 ? (
                invoices.data.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/75 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {inv.contact?.name || "Client"}
                      <div className="text-[11px] text-slate-400 font-normal">
                        {inv.contact?.whatsapp_number}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(inv.issue_date).toLocaleDateString("en-BD")}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(inv.due_date).toLocaleDateString("en-BD")}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700"
                          : inv.status === "OVERDUE"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-blue-50 text-blue-700"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatBDT(inv.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleSendWhatsApp(inv.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                          title="Dispatch WhatsApp Alert"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No invoices recorded yet. Click "New Invoice" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Invoice View Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Invoice {selectedInvoice.invoice_number}
                  </h2>
                  <p className="text-xs text-slate-500">Nefco Books Sales Ledger Record</p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-semibold text-slate-500 uppercase text-[10px]">Billed To</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">{selectedInvoice.contact?.name}</div>
                  <div className="text-slate-500">{selectedInvoice.contact?.whatsapp_number}</div>
                  <div className="text-slate-500">{selectedInvoice.contact?.address}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-500 uppercase text-[10px]">Financial Impact</div>
                  <div className="mt-1 font-mono text-xs text-slate-600">Debit: 1100 Accounts Receivable</div>
                  <div className="font-mono text-xs text-slate-600">Credit: 4000 Sales Revenue</div>
                </div>
              </div>

              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <th className="py-2 px-3">Item / Description</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedInvoice.line_items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-3 font-medium text-slate-800">{item.description}</td>
                      <td className="py-2 px-3 text-right font-mono">{item.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatBDT(item.unit_price)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{formatBDT(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t pt-3 flex justify-between items-center">
                <div className="text-xs text-slate-500">
                  Total Payable in BDT
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {formatBDT(selectedInvoice.total_amount)}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleSendWhatsApp(selectedInvoice.id);
                    setSelectedInvoice(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium flex items-center gap-1.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Send WhatsApp Alert</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
