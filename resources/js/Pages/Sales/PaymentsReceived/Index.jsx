import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DateField from "@/Components/DateField";
import { formatBDT, formatDate } from "@/lib/utils";
import {
  Plus,
  Search,
  ArrowDownLeft,
  X,
  Send,
  Trash2,
  Printer,
  FileText,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { Head, router, usePage } from "@inertiajs/react";

export default function PaymentsReceivedIndex({
  payments,
  customers,
  unpaid_invoices,
  deposit_accounts,
  next_payment_number,
  metrics,
  filters,
}) {
  const { flash } = usePage().props;
  const [notification, setNotification] = useState(flash?.success || null);
  const [search, setSearch] = useState(filters?.search || "");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [formPaymentNumber, setFormPaymentNumber] = useState(next_payment_number || "");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formInvoiceId, setFormInvoiceId] = useState("");
  const [formAccountId, setFormAccountId] = useState(deposit_accounts?.[0]?.id || "");
  const [formPaymentDate, setFormPaymentDate] = useState(todayStr);
  const [formAmount, setFormAmount] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState("CASH");
  const [formReferenceNumber, setFormReferenceNumber] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const paymentList = payments?.data || payments || [];
  const customerList = customers || [];
  const accountList = deposit_accounts || [];

  // Filter unpaid invoices for the selected customer
  const customerInvoices = unpaid_invoices?.filter(
    (inv) => String(inv.contact_id) === String(formCustomerId)
  ) || [];

  const handleOpenCreateDrawer = () => {
    setFormPaymentNumber(next_payment_number || `PAY-${new Date().getFullYear()}-0001`);
    setFormCustomerId("");
    setFormInvoiceId("");
    setFormAccountId(deposit_accounts?.[0]?.id || "");
    setFormPaymentDate(todayStr);
    setFormAmount("");
    setFormPaymentMethod("CASH");
    setFormReferenceNumber("");
    setFormNotes("");
    setIsDrawerOpen(true);
  };

  const handleCustomerChange = (custId) => {
    setFormCustomerId(custId);
    setFormInvoiceId("");
  };

  const handleInvoiceChange = (invId) => {
    setFormInvoiceId(invId);
    if (invId) {
      const inv = customerInvoices.find((i) => String(i.id) === String(invId));
      if (inv) {
        const remaining = Math.max(0, (parseFloat(inv.total_amount) || 0) - (parseFloat(inv.paid_amount) || 0));
        setFormAmount(remaining > 0 ? remaining : inv.total_amount);
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get("/sales/payments-received", { search }, { preserveState: true, replace: true });
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    router.get("/sales/payments-received", { search: val }, { preserveState: true, replace: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    router.post(
      "/sales/payments-received",
      {
        payment_number: formPaymentNumber,
        contact_id: formCustomerId,
        invoice_id: formInvoiceId || null,
        account_id: formAccountId,
        payment_date: formPaymentDate,
        amount: parseFloat(formAmount) || 0,
        payment_method: formPaymentMethod,
        reference_number: formReferenceNumber || null,
        notes: formNotes || null,
      },
      {
        onSuccess: () => {
          setIsDrawerOpen(false);
          setNotification("✅ Payment received and posted to General Ledger!");
        },
      }
    );
  };

  const handleDelete = (id, number) => {
    if (confirm(`Are you sure you want to delete Payment #${number}? This will reverse the ledger posting.`)) {
      router.delete(`/sales/payments-received/${id}`, {
        onSuccess: () => setNotification("Payment removed and ledger reversed."),
      });
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title="Payments Received - Sales - Nefco Books" />

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
              <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
              <span>Payments Received</span>
            </h1>
            <p className="text-xs text-slate-500">Record customer settlements, update invoice balances, and deposit funds (BDT ৳)</p>
          </div>
          <button
            onClick={handleOpenCreateDrawer}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Record Payment</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Received</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{formatBDT(metrics?.total_received || 0)}</div>
            <span className="text-[10px] text-slate-400">All-time customer settlements</span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">This Month</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">{formatBDT(metrics?.this_month_received || 0)}</div>
            <span className="text-[10px] text-slate-400">Received during current month</span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Transactions</span>
            <div className="text-xl font-bold text-blue-600 mt-1">{metrics?.count || 0}</div>
            <span className="text-[10px] text-slate-400">Recorded receipts in system</span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search payment #, ref #, or customer..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md w-72 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </form>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
              <tr>
                <th className="py-3 px-4">Payment #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Deposited To</th>
                <th className="py-3 px-4 text-right">Amount (BDT)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paymentList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No payment records found. Click <strong>+ Record Payment</strong> to add one.
                  </td>
                </tr>
              ) : (
                paymentList.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      <div>{pay.payment_number}</div>
                      {pay.reference_number && (
                        <div className="text-[10px] text-slate-400 font-normal">Ref: {pay.reference_number}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {formatDate(pay.payment_date)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{pay.contact?.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {pay.contact?.whatsapp_number || pay.contact?.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {pay.invoice ? (
                        <span className="text-blue-600 font-semibold">{pay.invoice.invoice_number}</span>
                      ) : (
                        <span className="text-slate-400 italic">Direct Receipt</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-300">
                        {pay.payment_method?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {pay.account?.name}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 font-mono">
                      {formatBDT(pay.amount)}
                    </td>
                    <td className="py-3 px-4 text-center space-x-1.5">
                      <button
                        onClick={() => setSelectedPayment(pay)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                      >
                        Receipt
                      </button>
                      <button
                        onClick={() => handleDelete(pay.id, pay.payment_number)}
                        className="p-1 text-slate-400 hover:text-red-600 transition"
                        title="Delete Payment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Record Payment Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Record Payment Received</h2>
                  <p className="text-xs text-slate-500">Deposit funds & clear customer accounts receivable (BDT ৳)</p>
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
                  <label className="text-xs font-semibold text-slate-700">Payment Number</label>
                  <input
                    type="text"
                    required
                    value={formPaymentNumber}
                    onChange={(e) => setFormPaymentNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Customer *</label>
                  <select
                    required
                    value={formCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  >
                    <option value="">-- Select Customer --</option>
                    {customerList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {formCustomerId && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Apply to Invoice (Optional)</label>
                    <select
                      value={formInvoiceId}
                      onChange={(e) => handleInvoiceChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    >
                      <option value="">-- Direct Receipt / No Invoice Link --</option>
                      {customerInvoices.map((inv) => {
                        const due = (parseFloat(inv.total_amount) || 0) - (parseFloat(inv.paid_amount) || 0);
                        return (
                          <option key={inv.id} value={inv.id}>
                            {inv.invoice_number} (Total: {formatBDT(inv.total_amount)}, Balance: {formatBDT(due)})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <DateField
                    label="Payment Date *"
                    required
                    value={formPaymentDate}
                    onChange={setFormPaymentDate}
                  />

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Amount Received (BDT) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono font-bold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Payment Mode *</label>
                    <select
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="MOBILE_BANKING">Mobile Banking (bKash/Nagad)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Deposit To Account *</label>
                    <select
                      required
                      value={formAccountId}
                      onChange={(e) => setFormAccountId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    >
                      {accountList.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Reference / Transaction ID</label>
                  <input
                    type="text"
                    value={formReferenceNumber}
                    onChange={(e) => setFormReferenceNumber(e.target.value)}
                    placeholder="e.g. Bank slip #, Cheque #, TrxID..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Notes / Remarks</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Internal receipt remarks..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
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
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Save Payment Received</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Receipt Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
                  <span className="font-bold text-sm">Payment Receipt - {selectedPayment.payment_number}</span>
                </div>
                <button onClick={() => setSelectedPayment(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs text-slate-700">
                <div className="text-center pb-4 border-b border-slate-200">
                  <div className="text-xl font-bold text-slate-900 tracking-tight">PAYMENT RECEIPT</div>
                  <div className="text-xs font-semibold text-emerald-600 mt-1">Nefco Books Cloud Accounting</div>
                  <div className="text-2xl font-bold text-slate-900 mt-3 font-mono">{formatBDT(selectedPayment.amount)}</div>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Payment Recorded ✓
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Number:</span>
                    <span className="font-mono font-semibold">{selectedPayment.payment_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Date:</span>
                    <span className="font-mono">{formatDate(selectedPayment.payment_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer:</span>
                    <span className="font-semibold text-slate-800">{selectedPayment.contact?.name}</span>
                  </div>
                  {selectedPayment.invoice && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Invoice Ref:</span>
                      <span className="font-mono text-blue-600 font-semibold">{selectedPayment.invoice.invoice_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Mode:</span>
                    <span>{selectedPayment.payment_method?.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Deposited To:</span>
                    <span className="font-medium">{selectedPayment.account?.name}</span>
                  </div>
                  {selectedPayment.reference_number && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reference #:</span>
                      <span className="font-mono">{selectedPayment.reference_number}</span>
                    </div>
                  )}
                  {selectedPayment.notes && (
                    <div className="pt-2 text-slate-500 border-t border-slate-100">
                      <strong>Notes:</strong> {selectedPayment.notes}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-md transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
