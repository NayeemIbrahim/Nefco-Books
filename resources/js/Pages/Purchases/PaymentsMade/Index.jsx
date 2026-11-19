import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DateField from "@/Components/DateField";
import { formatBDT, formatDate } from "@/lib/utils";
import {
  Plus,
  Search,
  ArrowUpRight,
  X,
  Send,
  Trash2,
  Printer,
  CreditCard,
} from "lucide-react";
import { Head, router, usePage } from "@inertiajs/react";

export default function PaymentsMadeIndex({
  payments,
  vendors,
  unpaid_bills,
  paid_from_accounts,
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
  const [formVendorId, setFormVendorId] = useState("");
  const [formBillId, setFormBillId] = useState("");
  const [formAccountId, setFormAccountId] = useState(paid_from_accounts?.[0]?.id || "");
  const [formPaymentDate, setFormPaymentDate] = useState(todayStr);
  const [formAmount, setFormAmount] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState("CASH");
  const [formReferenceNumber, setFormReferenceNumber] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const paymentList = payments?.data || payments || [];
  const vendorList = vendors || [];
  const accountList = paid_from_accounts || [];

  // Filter unpaid bills for the selected vendor
  const vendorBills = unpaid_bills?.filter(
    (b) => String(b.contact_id) === String(formVendorId)
  ) || [];

  const handleOpenCreateDrawer = () => {
    setFormPaymentNumber(next_payment_number || `VPAY-${new Date().getFullYear()}-0001`);
    setFormVendorId("");
    setFormBillId("");
    setFormAccountId(paid_from_accounts?.[0]?.id || "");
    setFormPaymentDate(todayStr);
    setFormAmount("");
    setFormPaymentMethod("CASH");
    setFormReferenceNumber("");
    setFormNotes("");
    setIsDrawerOpen(true);
  };

  const handleVendorChange = (vId) => {
    setFormVendorId(vId);
    setFormBillId("");
  };

  const handleBillChange = (bId) => {
    setFormBillId(bId);
    if (bId) {
      const bill = vendorBills.find((b) => String(b.id) === String(bId));
      if (bill) {
        const remaining = Math.max(0, (parseFloat(bill.total_amount) || 0) - (parseFloat(bill.paid_amount) || 0));
        setFormAmount(remaining > 0 ? remaining : bill.total_amount);
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get("/purchases/payments-made", { search }, { preserveState: true, replace: true });
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    router.get("/purchases/payments-made", { search: val }, { preserveState: true, replace: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    router.post(
      "/purchases/payments-made",
      {
        payment_number: formPaymentNumber,
        contact_id: formVendorId,
        bill_id: formBillId || null,
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
          setNotification("✅ Vendor payment recorded and posted to General Ledger!");
        },
      }
    );
  };

  const handleDelete = (id, number) => {
    if (confirm(`Are you sure you want to delete Vendor Payment #${number}? This will reverse the ledger entry.`)) {
      router.delete(`/purchases/payments-made/${id}`, {
        onSuccess: () => setNotification("Vendor payment deleted and ledger reversed."),
      });
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title="Payments Made - Purchases - Nefco Books" />

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
              <ArrowUpRight className="h-5 w-5 text-red-600" />
              <span>Payments Made</span>
            </h1>
            <p className="text-xs text-slate-500">Record disbursements, settlements against vendor bills, and supplier payments (BDT ৳)</p>
          </div>
          <button
            onClick={handleOpenCreateDrawer}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Record Payment</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Payments Made</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{formatBDT(metrics?.total_paid || 0)}</div>
            <span className="text-[10px] text-slate-400">All-time vendor disbursements</span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">This Month</span>
            <div className="text-xl font-bold text-red-600 mt-1">{formatBDT(metrics?.this_month_paid || 0)}</div>
            <span className="text-[10px] text-slate-400">Paid out during current month</span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Transactions</span>
            <div className="text-xl font-bold text-slate-800 mt-1">{metrics?.count || 0}</div>
            <span className="text-[10px] text-slate-400">Recorded payment vouchers</span>
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
                placeholder="Search payment #, ref #, or vendor..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md w-72 focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </form>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
              <tr>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Bill #</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Paid From</th>
                <th className="py-3 px-4 text-right">Amount (BDT)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paymentList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No vendor payments recorded. Click <strong>+ Record Payment</strong> to add one.
                  </td>
                </tr>
              ) : (
                paymentList.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-red-700">
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
                        {pay.contact?.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {pay.bill ? (
                        <span className="text-amber-600 font-semibold">{pay.bill.bill_number}</span>
                      ) : (
                        <span className="text-slate-400 italic">Direct / Advance</span>
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
                    <td className="py-3 px-4 text-right font-bold text-red-700 font-mono">
                      {formatBDT(pay.amount)}
                    </td>
                    <td className="py-3 px-4 text-center space-x-1.5">
                      <button
                        onClick={() => setSelectedPayment(pay)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                      >
                        Voucher
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
                  <h2 className="text-base font-bold text-slate-900">Record Vendor Payment Made</h2>
                  <p className="text-xs text-slate-500">Disburse funds & clear accounts payable (BDT ৳)</p>
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
                  <label className="text-xs font-semibold text-slate-700">Payment Voucher #</label>
                  <input
                    type="text"
                    required
                    value={formPaymentNumber}
                    onChange={(e) => setFormPaymentNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Vendor / Supplier *</label>
                  <select
                    required
                    value={formVendorId}
                    onChange={(e) => handleVendorChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendorList.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} {v.phone ? `(${v.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {formVendorId && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Apply to Vendor Bill (Optional)</label>
                    <select
                      value={formBillId}
                      onChange={(e) => handleBillChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    >
                      <option value="">-- Direct Payment / Advance --</option>
                      {vendorBills.map((b) => {
                        const due = (parseFloat(b.total_amount) || 0) - (parseFloat(b.paid_amount) || 0);
                        return (
                          <option key={b.id} value={b.id}>
                            {b.bill_number} (Total: {formatBDT(b.total_amount)}, Balance: {formatBDT(due)})
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
                    <label className="text-xs font-semibold text-slate-700">Amount Paid (BDT) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono font-bold text-red-700"
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
                    <label className="text-xs font-semibold text-slate-700">Paid From Account *</label>
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
                  <label className="text-xs font-semibold text-slate-700">Reference / Cheque #</label>
                  <input
                    type="text"
                    value={formReferenceNumber}
                    onChange={(e) => setFormReferenceNumber(e.target.value)}
                    placeholder="e.g. Cheque #, Online transfer Ref..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Notes / Purpose</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Payment purpose or voucher details..."
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
                    className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md transition shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Save Payment Made</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Voucher Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-red-400" />
                  <span className="font-bold text-sm">Payment Voucher - {selectedPayment.payment_number}</span>
                </div>
                <button onClick={() => setSelectedPayment(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs text-slate-700">
                <div className="text-center pb-4 border-b border-slate-200">
                  <div className="text-xl font-bold text-slate-900 tracking-tight">PAYMENT VOUCHER</div>
                  <div className="text-xs font-semibold text-slate-600 mt-1">Nefco Books Cloud Accounting</div>
                  <div className="text-2xl font-bold text-red-600 mt-3 font-mono">{formatBDT(selectedPayment.amount)}</div>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                    Disbursed & Posted ✓
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Voucher Number:</span>
                    <span className="font-mono font-semibold">{selectedPayment.payment_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date:</span>
                    <span className="font-mono">{formatDate(selectedPayment.payment_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paid To Vendor:</span>
                    <span className="font-semibold text-slate-800">{selectedPayment.contact?.name}</span>
                  </div>
                  {selectedPayment.bill && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Against Bill:</span>
                      <span className="font-mono text-amber-600 font-semibold">{selectedPayment.bill.bill_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Mode:</span>
                    <span>{selectedPayment.payment_method?.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paid From Account:</span>
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
                      <strong>Remarks:</strong> {selectedPayment.notes}
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
                  <span>Print Voucher</span>
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
