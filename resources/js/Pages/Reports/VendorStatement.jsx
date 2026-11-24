import React, { useState } from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT, formatDate, getWhatsAppShareUrl } from "@/lib/utils";
import { router, Link, usePage } from "@inertiajs/react";
import {
  FileText,
  X,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  Phone,
  Calendar,
} from "lucide-react";

export default function VendorStatement({
  contact,
  current_balance = 0,
  entries = [],
  allVendors = [],
  paid_from_accounts = [],
  filters = {},
}) {
  const { company } = usePage().props;
  const todayStr = new Date().toISOString().split("T")[0];

  const [selectedContact, setSelectedContact] = useState(filters.contact_id || (contact ? contact.id : ""));
  const [selectedBill, setSelectedBill] = useState(null);

  // Settlement Form inside Popup
  const [modalPayAmount, setModalPayAmount] = useState("");
  const [modalPayDate, setModalPayDate] = useState(todayStr);
  const [modalPayAccount, setModalPayAccount] = useState(paid_from_accounts?.[0]?.id || "");
  const [modalPayMethod, setModalPayMethod] = useState("CASH");
  const [modalPayRef, setModalPayRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVendorChange = (e) => {
    const cid = e.target.value;
    setSelectedContact(cid);
    router.get(
      "/reports/vendor-statement",
      { ...filters, contact_id: cid },
      { preserveState: true, replace: true }
    );
  };

  const handleOpenBillModal = (bill) => {
    if (!bill) return;
    setSelectedBill(bill);
    const total = parseFloat(bill.total_amount) || 0;
    const paid = parseFloat(bill.paid_amount) || 0;
    const due = Math.max(0, total - paid);
    setModalPayAmount(due > 0 ? due : "");
    setModalPayDate(todayStr);
    setModalPayAccount(paid_from_accounts?.[0]?.id || "");
    setModalPayMethod("CASH");
    setModalPayRef("");
  };

  const handleModalPayment = (e) => {
    e.preventDefault();
    if (!selectedBill || !modalPayAmount || parseFloat(modalPayAmount) <= 0) return;
    setIsSubmitting(true);
    router.post(
      "/purchases/payments-made",
      {
        contact_id: selectedBill.contact_id || contact?.id,
        bill_id: selectedBill.id,
        amount: parseFloat(modalPayAmount),
        account_id: modalPayAccount || paid_from_accounts?.[0]?.id,
        payment_date: modalPayDate || todayStr,
        payment_method: modalPayMethod,
        reference_number: modalPayRef,
        notes: `Settlement for bill ${selectedBill.bill_number} from statement`,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSelectedBill(null);
          setIsSubmitting(false);
          router.reload({ preserveScroll: true });
        },
        onError: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  const vendorPicker = (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-semibold text-slate-600">Select Vendor:</span>
      <select
        value={selectedContact}
        onChange={handleVendorChange}
        className="text-xs py-1 px-2.5 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
      >
        {allVendors.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <ReportLayout
      title={`Vendor Statement - ${contact ? contact.name : "Select Vendor"}`}
      subtitle={contact ? `Statement of Account for ${contact.name} (${contact.phone || contact.email || "No contact info"})` : ""}
      filters={filters}
      extraFilters={vendorPicker}
    >
      <div className="space-y-6">
        {contact && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">{contact.name}</h3>
              <p className="text-xs text-slate-500">{contact.address || "Address not specified"}</p>
              <p className="text-xs text-slate-500">Phone: {contact.phone || contact.whatsapp_number || "N/A"}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Current Payable Due</span>
              <span className="text-lg font-bold font-mono text-amber-700">{formatBDT(current_balance)}</span>
            </div>
          </div>
        )}

        <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-inner">
          <table className="w-full text-xs text-left text-slate-600 min-w-[700px]">
            <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Transaction Type</th>
                <th className="py-2.5 px-3">Reference #</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3 text-right">Debit (Payments) (৳)</th>
                <th className="py-2.5 px-3 text-right">Credit (Bills) (৳)</th>
                <th className="py-2.5 px-3 text-right">Payable Balance (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 italic">No statement records found for this vendor.</td>
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
                            : entry.type === "BILL"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold">
                      {entry.type === "BILL" ? (
                        <button
                          type="button"
                          onClick={() => handleOpenBillModal(entry.bill || {
                            id: entry.id,
                            bill_number: entry.reference,
                            issue_date: entry.date,
                            total_amount: entry.credit,
                            paid_amount: 0,
                            contact: contact,
                            status: entry.credit > 0 ? "UNPAID" : "PAID",
                          })}
                          className="text-amber-700 hover:text-amber-900 hover:underline font-bold text-left inline-flex items-center gap-1 cursor-pointer"
                          title="Click to view & update bill"
                        >
                          <span>{entry.reference}</span>
                          <ExternalLink className="h-3 w-3 text-amber-500" />
                        </button>
                      ) : entry.type === "PAYMENT" ? (
                        <Link href="/purchases/payments-made" className="text-emerald-700 hover:text-emerald-900 hover:underline">
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
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                    {formatBDT(entries.reduce((sum, e) => sum + e.debit, 0))}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-700">
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

      {/* Bill Detail & Update Popup Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm leading-tight text-white flex items-center gap-2">
                    <span>Vendor Bill #{selectedBill.bill_number}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        selectedBill.status === "PAID"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {selectedBill.status || "CONFIRMED"}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Vendor Statement Reference</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
              {/* Vendor & Date Info */}
              <div className="flex flex-wrap justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{selectedBill.contact?.name || contact?.name || "Vendor"}</h4>
                  <p className="text-slate-500">{selectedBill.contact?.phone || selectedBill.contact?.whatsapp_number || contact?.phone || "No phone"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-600 font-medium">
                    <span className="text-slate-400">Bill Date:</span> {formatDate(selectedBill.issue_date || selectedBill.created_at)}
                  </p>
                  {selectedBill.due_date && (
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      <span className="text-slate-400">Due Date:</span> {formatDate(selectedBill.due_date)}
                    </p>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Item / Expense Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Price (৳)</th>
                      <th className="p-2.5 text-right">Total (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {((selectedBill.line_items || selectedBill.lineItems || []).length > 0) ? (
                      (selectedBill.line_items || selectedBill.lineItems || []).map((li, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-medium text-slate-800">{li.description || li.item?.name || "Item / Expense"}</td>
                          <td className="p-2.5 text-center font-mono">{li.quantity}</td>
                          <td className="p-2.5 text-right font-mono">{formatBDT(li.unit_price)}</td>
                          <td className="p-2.5 text-right font-semibold font-mono">{formatBDT(li.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-2.5 font-medium text-slate-800">Vendor Purchase / Expense</td>
                        <td className="p-2.5 text-center font-mono">1</td>
                        <td className="p-2.5 text-right font-mono">{formatBDT(selectedBill.total_amount)}</td>
                        <td className="p-2.5 text-right font-semibold font-mono">{formatBDT(selectedBill.total_amount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary Totals */}
              {(() => {
                const total = parseFloat(selectedBill.total_amount) || 0;
                const isPaid = selectedBill.status === "PAID" || (parseFloat(selectedBill.paid_amount) || 0) >= total;
                const paid = isPaid ? total : (parseFloat(selectedBill.paid_amount) || 0);
                const due = isPaid ? 0 : Math.max(0, total - paid);

                return (
                  <div className="bg-slate-50 p-3.5 rounded-lg space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between items-center font-bold text-sm text-slate-900">
                      <span>Total Bill Amount</span>
                      <span className="text-amber-700 font-mono">{formatBDT(total)}</span>
                    </div>
                    {paid > 0 && (
                      <div className="flex justify-between items-center text-emerald-700 font-semibold">
                        <span>Paid to Date</span>
                        <span className="font-mono">{formatBDT(paid)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-bold pt-1 border-t border-slate-200">
                      <span>Balance Outstanding Due</span>
                      <span className={`font-mono ${due <= 0 ? "text-emerald-600" : "text-amber-700 font-black text-sm"}`}>
                        {formatBDT(due)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Settlement Form inside Popup */}
              {(() => {
                const total = parseFloat(selectedBill.total_amount) || 0;
                const isPaid = selectedBill.status === "PAID" || (parseFloat(selectedBill.paid_amount) || 0) >= total;
                const due = isPaid ? 0 : Math.max(0, total - (parseFloat(selectedBill.paid_amount) || 0));

                if (due <= 0) {
                  return (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>This bill is fully settled & paid in full! (Balance Due: ৳0.00)</span>
                    </div>
                  );
                }

                return (
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                        <span>Pay Bill & Update Ledger</span>
                      </div>
                      <span className="text-[10px] text-amber-800 font-medium">Direct General Ledger Post</span>
                    </div>

                    <form onSubmit={handleModalPayment} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase">Payment Date *</label>
                          <input
                            type="date"
                            required
                            value={modalPayDate}
                            onChange={(e) => setModalPayDate(e.target.value)}
                            className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase">Amount (৳) *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            min="0.01"
                            max={due}
                            value={modalPayAmount}
                            onChange={(e) => setModalPayAmount(e.target.value)}
                            className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase">Paid From *</label>
                          <select
                            value={modalPayAccount}
                            onChange={(e) => setModalPayAccount(e.target.value)}
                            className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                          >
                            {(paid_from_accounts || []).map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} ({acc.code})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase">Method</label>
                          <select
                            value={modalPayMethod}
                            onChange={(e) => setModalPayMethod(e.target.value)}
                            className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="CASH">Cash</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="MOBILE_BANKING">Mobile Banking</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <input
                          type="text"
                          value={modalPayRef}
                          onChange={(e) => setModalPayRef(e.target.value)}
                          placeholder="Optional Reference # (e.g. Cheque / TxID)"
                          className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-amber-500 w-full sm:w-64"
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting || !modalPayAmount}
                          className="w-full sm:w-auto px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs transition disabled:opacity-50 shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{isSubmitting ? "Processing..." : `Record & Pay ৳${parseFloat(modalPayAmount || 0).toLocaleString()}`}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Link
                  href={`/purchases/bills?search=${encodeURIComponent(selectedBill.bill_number)}`}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  <span>Edit Full Bill in Bills Page</span>
                </Link>
                {selectedBill.contact?.phone && (
                  <a
                    href={getWhatsAppShareUrl(selectedBill, { company, isBill: true })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>WhatsApp Bill</span>
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </ReportLayout>
  );
}
