import React, { useState } from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";
import { router, Link } from "@inertiajs/react";

export default function CustomerStatement({
  contact,
  current_balance = 0,
  entries = [],
  allCustomers = [],
  filters = {},
}) {
  const [selectedContact, setSelectedContact] = useState(filters.contact_id || (contact ? contact.id : ""));

  const handleCustomerChange = (e) => {
    const cid = e.target.value;
    setSelectedContact(cid);
    router.get(
      "/reports/customer-statement",
      { ...filters, contact_id: cid },
      { preserveState: true, replace: true }
    );
  };

  const customerPicker = (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-semibold text-slate-600">Select Customer:</span>
      <select
        value={selectedContact}
        onChange={handleCustomerChange}
        className="text-xs py-1 px-2.5 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
      >
        {allCustomers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <ReportLayout
      title={`Customer Statement - ${contact ? contact.name : "Select Customer"}`}
      subtitle={contact ? `Statement of Account for ${contact.name} (${contact.phone || contact.email || "No contact info"})` : ""}
      filters={filters}
      extraFilters={customerPicker}
    >
      <div className="space-y-6">
        {/* Customer Header Summary */}
        {contact && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">{contact.name}</h3>
              <p className="text-xs text-slate-500">{contact.address || "Address not specified"}</p>
              <p className="text-xs text-slate-500">Phone: {contact.phone || contact.whatsapp_number || "N/A"}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Current Balance</span>
              <span className="text-lg font-bold font-mono text-blue-700">{formatBDT(current_balance)}</span>
            </div>
          </div>
        )}

        {/* Statement Table */}
        <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-inner">
          <table className="w-full text-xs text-left text-slate-600 min-w-[700px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Transaction Type</th>
                <th className="py-2.5 px-3">Reference #</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3 text-right">Debit (Amount) (৳)</th>
                <th className="py-2.5 px-3 text-right">Credit (Payments) (৳)</th>
                <th className="py-2.5 px-3 text-right">Balance Due (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 italic">No statement records found for this customer.</td>
                </tr>
              ) : (
                entries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">{entry.date}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          entry.type === "OPENING_BALANCE"
                            ? "bg-purple-100 text-purple-800"
                            : entry.type === "INVOICE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold">
                      {entry.type === "INVOICE" ? (
                        <Link href="/sales/invoices" className="text-blue-600 hover:text-blue-800 hover:underline">
                          {entry.reference}
                        </Link>
                      ) : entry.type === "PAYMENT" ? (
                        <Link href="/sales/payments-received" className="text-emerald-700 hover:text-emerald-900 hover:underline">
                          {entry.reference}
                        </Link>
                      ) : (
                        <span className="text-slate-800">{entry.reference}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px]">{entry.description}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-900">
                      {entry.debit > 0 ? formatBDT(entry.debit) : "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-900">
                      {entry.credit > 0 ? formatBDT(entry.credit) : "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatBDT(entry.running_balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {entries.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan="4" className="py-2.5 px-3 uppercase text-right">Closing Balance</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-700">
                    {formatBDT(entries.reduce((sum, e) => sum + e.debit, 0))}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                    {formatBDT(entries.reduce((sum, e) => sum + e.credit, 0))}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 text-sm">
                    {formatBDT(current_balance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </ReportLayout>
  );
}
