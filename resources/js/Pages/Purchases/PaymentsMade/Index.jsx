import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DateField from "@/Components/DateField";
import Pagination from "@/Components/Pagination";
import { formatBDT, formatDate, getPaymentWhatsAppShareUrl } from "@/lib/utils";
import {
  Plus,
  Search,
  ArrowUpRight,
  X,
  Trash2,
  Printer,
  Receipt,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Edit,
} from "lucide-react";
import { Head, Link, router, usePage } from "@inertiajs/react";

export default function PaymentsMadeIndex({
  payments,
  vendors,
  unpaid_bills,
  paid_from_accounts,
  next_payment_number,
  metrics,
  filters,
}) {
  const { flash, company } = usePage().props;
  const todayStr = new Date().toISOString().split("T")[0];
  const [activeTab, setActiveTab] = useState("UNPAID_BILLS"); // 'UNPAID_BILLS' | 'HISTORY'
  const [notification, setNotification] = useState(flash?.success || null);
  const [search, setSearch] = useState(filters?.search || "");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);

  // Modal Bill Settlement State inside Popup
  const [modalPayAmount, setModalPayAmount] = useState("");
  const [modalPayDate, setModalPayDate] = useState(todayStr);
  const [modalPayAccount, setModalPayAccount] = useState(paid_from_accounts?.[0]?.id || "");
  const [modalPayMethod, setModalPayMethod] = useState("CASH");
  const [modalPayRef, setModalPayRef] = useState("");
  const [isSubmittingBillPay, setIsSubmittingBillPay] = useState(false);

  const handleOpenBillModal = (bill) => {
    setSelectedBill(bill);
    if (bill) {
      const isPaid = bill.status === "PAID" || (parseFloat(bill.paid_amount) || 0) >= (parseFloat(bill.total_amount) || 0);
      const due = isPaid ? 0 : Math.max(0, (parseFloat(bill.total_amount) || 0) - (parseFloat(bill.paid_amount) || 0));
      setModalPayAmount(due > 0 ? due : "");
      setModalPayDate(todayStr);
      setModalPayAccount(paid_from_accounts?.[0]?.id || "");
      setModalPayMethod("CASH");
      setModalPayRef("");
    }
  };

  const handleModalBillPayment = (e) => {
    e.preventDefault();
    if (!selectedBill || !modalPayAmount || parseFloat(modalPayAmount) <= 0) return;
    setIsSubmittingBillPay(true);
    router.post(
      "/purchases/payments-made",
      {
        contact_id: selectedBill.contact_id,
        bill_id: selectedBill.id,
        amount: parseFloat(modalPayAmount),
        account_id: modalPayAccount || paid_from_accounts?.[0]?.id,
        payment_date: modalPayDate || todayStr,
        payment_method: modalPayMethod,
        reference_number: modalPayRef,
        notes: `Payment for bill ${selectedBill.bill_number}`,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSelectedBill(null);
          setIsSubmittingBillPay(false);
          setNotification(`✅ Payment of ${formatBDT(modalPayAmount)} on Bill #${selectedBill.bill_number} recorded & posted!`);
        },
        onError: () => setIsSubmittingBillPay(false),
      }
    );
  };

  // Inline row payment states (for fast direct payment from table)
  const [inlineAmounts, setInlineAmounts] = useState({});
  const [inlineAccounts, setInlineAccounts] = useState({});
  const [inlineMethods, setInlineMethods] = useState({});

  // Form State for Drawer
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
  const unpaidBillsList = unpaid_bills || [];
  const vendorList = vendors || [];
  const accountList = paid_from_accounts || [];

  // Filter unpaid bills for the drawer vendor
  const vendorBills = unpaidBillsList.filter(
    (b) => String(b.contact_id) === String(formVendorId)
  );

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

  // Direct fast payment submission from table row
  const handleInlinePayBill = (bill) => {
    const balDue = Math.max(0, (parseFloat(bill.total_amount) || 0) - (parseFloat(bill.paid_amount) || 0));
    const payAmt = parseFloat(inlineAmounts[bill.id] !== undefined ? inlineAmounts[bill.id] : balDue) || 0;
    if (payAmt <= 0) {
      alert("Please enter a valid payment amount greater than 0.");
      return;
    }
    const accId = inlineAccounts[bill.id] || accountList[0]?.id;
    if (!accId) {
      alert("Please select an account to pay from.");
      return;
    }
    const mode = inlineMethods[bill.id] || "CASH";

    router.post(
      "/purchases/payments-made",
      {
        contact_id: bill.contact_id,
        bill_id: bill.id,
        account_id: accId,
        payment_date: todayStr,
        amount: payAmt,
        payment_method: mode,
        notes: `Direct payment on vendor bill #${bill.bill_number}`,
      },
      {
        onSuccess: () => {
          setNotification(`✅ Paid ${formatBDT(payAmt)} on Vendor Bill #${bill.bill_number}!`);
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
              <ArrowUpRight className="h-5 w-5 text-amber-600" />
              <span>Payments Made</span>
            </h1>
            <p className="text-xs text-slate-500">Record payments to vendors, settle bills, and track cash outflows (BDT ৳)</p>
          </div>
          <button
            onClick={handleOpenCreateDrawer}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Make Payment</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Paid</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{formatBDT(metrics?.total_paid || 0)}</div>
            <span className="text-[10px] text-slate-400">All-time vendor settlements</span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">This Month</span>
            <div className="text-xl font-bold text-amber-600 mt-1">{formatBDT(metrics?.this_month_paid || 0)}</div>
            <span className="text-[10px] text-slate-400">Paid during current month</span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Outstanding Bills</span>
            <div className="text-xl font-bold text-blue-600 mt-1">{unpaidBillsList.length}</div>
            <span className="text-[10px] text-slate-400">Bills ready for payment</span>
          </div>
        </div>

        {/* Tab Switcher: Unpaid & Due Bills vs Payments Made History */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("UNPAID_BILLS")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
              activeTab === "UNPAID_BILLS"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Unpaid & Due Bills ({unpaidBillsList.length})</span>
            {unpaidBillsList.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black">
                {unpaidBillsList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
              activeTab === "HISTORY"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Payments Made History ({payments?.total ?? paymentList.length})</span>
          </button>
        </div>

        {activeTab === "UNPAID_BILLS" ? (
          /* Tab 1: Unpaid / Partial Bills List with INLINE PAYMENT INPUTS */
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                  <span>Unpaid & Partially Paid Vendor Bills</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Directly enter settlement amount and click "Pay Bill" to post to General Ledger.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-xs text-left text-slate-600">
                <thead className="bg-slate-100/70 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Bill #</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Total (BDT)</th>
                    <th className="py-3 px-4 text-right">Balance Due (BDT)</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unpaidBillsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        🎉 All vendor bills are fully paid! No pending liabilities.
                      </td>
                    </tr>
                  ) : (
                    unpaidBillsList.map((bill) => {
                      const balDue = Math.max(0, (parseFloat(bill.total_amount) || 0) - (parseFloat(bill.paid_amount) || 0));
                      const isOverdue = bill.due_date && new Date(bill.due_date) < new Date(todayStr);

                      return (
                        <tr key={bill.id} className="hover:bg-amber-50/30 transition">
                          <td className="py-3 px-4 font-mono font-bold text-amber-700">
                            <button
                              type="button"
                              onClick={() => handleOpenBillModal(bill)}
                              className="hover:underline hover:text-amber-900 transition flex items-center gap-1.5 cursor-pointer text-left font-mono font-bold text-amber-700"
                              title="Click to view Bill details & pay"
                            >
                              <Receipt className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              <span>{bill.bill_number}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{bill.contact?.name || "Vendor"}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {bill.contact?.whatsapp_number || bill.contact?.phone}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>{formatDate(bill.due_date)}</div>
                            {isOverdue && (
                              <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded text-[9px] font-bold">
                                OVERDUE
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                            {formatBDT(bill.total_amount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                            {formatBDT(balDue)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap space-x-1">
                            <Link
                              href={`/purchases/bills?search=${encodeURIComponent(bill.bill_number)}`}
                              className="inline-flex p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded transition"
                              title="Edit Bill"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete bill #${bill.bill_number}?`)) {
                                  router.delete(`/purchases/bills/${bill.id}`, { preserveScroll: true });
                                }
                              }}
                              className="inline-flex p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete Bill"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Tab 2: Payments Made History */
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search payment #, ref #, or vendor..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md w-72 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </form>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600 min-w-[750px]">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Payment #</th>
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
                        No payments recorded yet. Click <strong>+ Make Payment</strong> to record one.
                      </td>
                    </tr>
                  ) : (
                    paymentList.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-amber-700">
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
                          {pay.bill ? (
                            <button
                              type="button"
                              onClick={() => handleOpenBillModal(pay.bill)}
                              className="text-amber-700 hover:text-amber-900 hover:underline font-semibold flex items-center gap-1.5 cursor-pointer font-mono"
                              title="Click to view Bill details & pay"
                            >
                              <Receipt className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              <span>{pay.bill.bill_number}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 italic">Direct Vendor Payment</span>
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
                        <td className="py-3 px-4 text-right font-bold text-amber-700 font-mono">
                          {formatBDT(pay.amount)}
                        </td>
                        <td className="py-3 px-4 text-center space-x-1">
                          <a
                            href={getPaymentWhatsAppShareUrl(pay, { company, isVendor: true })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                            title="Share Payment Voucher on WhatsApp"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </a>
                          <button
                            onClick={() => setSelectedPayment(pay)}
                            className="p-1 text-slate-500 hover:text-amber-700 hover:bg-slate-100 rounded"
                            title="View Receipt"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(pay.id, pay.payment_number)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete Payment (Reverses Ledger)"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
              <Pagination meta={payments} />
            </div>
          </div>
        )}

        {/* Drawer Form for manual payment */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Record Vendor Payment</h2>
                  <p className="text-xs text-slate-500">Record settlement against vendor bill or direct payment</p>
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
                    <label className="text-xs font-semibold text-slate-700">Payment Number</label>
                    <input
                      type="text"
                      required
                      value={formPaymentNumber}
                      onChange={(e) => setFormPaymentNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <DateField
                    label="Payment Date *"
                    required
                    value={formPaymentDate}
                    onChange={setFormPaymentDate}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Vendor *</label>
                  <select
                    required
                    value={formVendorId}
                    onChange={(e) => {
                      setFormVendorId(e.target.value);
                      setFormBillId("");
                    }}
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

                {vendorBills.length > 0 && (
                  <div className="space-y-1 bg-amber-50/50 p-3 rounded-lg border border-amber-200">
                    <label className="text-xs font-bold text-amber-900">Apply to Outstanding Bill (Optional)</label>
                    <select
                      value={formBillId}
                      onChange={(e) => handleBillChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-amber-300 rounded-md bg-white font-mono"
                    >
                      <option value="">-- Direct Payment (Not tied to bill) --</option>
                      {vendorBills.map((b) => {
                        const rem = Math.max(0, (parseFloat(b.total_amount) || 0) - (parseFloat(b.paid_amount) || 0));
                        return (
                          <option key={b.id} value={b.id}>
                            {b.bill_number} (Total: {formatBDT(b.total_amount)} | Due: {formatBDT(rem)})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Payment Amount (BDT) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Payment Method *</label>
                    <select
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    >
                      <option value="CASH">CASH</option>
                      <option value="BANK_TRANSFER">BANK TRANSFER</option>
                      <option value="CHEQUE">CHEQUE</option>
                      <option value="MOBILE_BANKING">MOBILE BANKING (bKash/Nagad)</option>
                    </select>
                  </div>
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
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Reference / Trx ID</label>
                  <input
                    type="text"
                    value={formReferenceNumber}
                    onChange={(e) => setFormReferenceNumber(e.target.value)}
                    placeholder="e.g. Cheque # / Trx ID"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Notes / Remarks</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Payment remarks or reference..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold shadow-xs"
                  >
                    Save & Post Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Receipt Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-amber-400" />
                  <span className="font-bold text-sm">Voucher #{selectedPayment.payment_number}</span>
                </div>
                <button onClick={() => setSelectedPayment(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs text-slate-700">
                <div className="text-center pb-4 border-b border-slate-200">
                  <div className="text-xl font-bold text-slate-900 tracking-tight">PAYMENT VOUCHER</div>
                  <div className="text-xs font-semibold text-amber-600 mt-1">Nefco Books Cloud Accounting</div>
                  <div className="text-2xl font-bold text-slate-900 mt-3 font-mono">{formatBDT(selectedPayment.amount)}</div>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Vendor Payment Posted ✓
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Voucher Number:</span>
                    <span className="font-mono font-semibold">{selectedPayment.payment_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Date:</span>
                    <span className="font-mono">{formatDate(selectedPayment.payment_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paid To:</span>
                    <span className="font-semibold text-slate-800">{selectedPayment.contact?.name}</span>
                  </div>
                  {selectedPayment.bill && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bill Ref:</span>
                      <span className="font-mono text-amber-700 font-semibold">{selectedPayment.bill.bill_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Mode:</span>
                    <span>{selectedPayment.payment_method?.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paid From:</span>
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

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition shadow-xs"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Voucher</span>
                  </button>
                  <a
                    href={getPaymentWhatsAppShareUrl(selectedPayment, { company, isVendor: true })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition shadow-xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
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

        {/* Bill Detail Modal Popup */}
        {selectedBill && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-lg max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in duration-150 flex flex-col max-h-[92vh]">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-amber-400" />
                  <span className="font-bold text-sm font-mono">Bill Details - {selectedBill.bill_number}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBill(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{selectedBill.contact?.name || "Vendor"}</h3>
                    <p className="text-slate-500">{selectedBill.contact?.whatsapp_number || selectedBill.contact?.phone || "Vendor Contact"}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        selectedBill.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {selectedBill.status || "CONFIRMED"}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      <span className="font-semibold text-slate-600">Transaction Date:</span> {formatDate(selectedBill.bill_date || selectedBill.created_at)}
                    </p>
                    {selectedBill.due_date && (
                      <p className="text-[11px] text-slate-500">
                        Due: {formatDate(selectedBill.due_date)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Line Items */}
                <div className="border border-slate-200 rounded-md overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="p-2">Item / Description</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Price (৳)</th>
                        <th className="p-2 text-right">Amount (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {((selectedBill.line_items || selectedBill.lineItems || []).length > 0) ? (
                        (selectedBill.line_items || selectedBill.lineItems || []).map((li, i) => (
                          <tr key={i}>
                            <td className="p-2 font-medium text-slate-800">{li.description}</td>
                            <td className="p-2 text-center font-mono">{li.quantity}</td>
                            <td className="p-2 text-right font-mono">{formatBDT(li.unit_price)}</td>
                            <td className="p-2 text-right font-semibold font-mono">{formatBDT(li.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="p-2 font-medium text-slate-800">Vendor Purchase / Expense</td>
                          <td className="p-2 text-center font-mono">1</td>
                          <td className="p-2 text-right font-mono">{formatBDT(selectedBill.total_amount)}</td>
                          <td className="p-2 text-right font-semibold font-mono">{formatBDT(selectedBill.total_amount)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Totals */}
                <div className="bg-slate-50 p-3.5 rounded-md space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between items-center font-bold text-sm text-slate-900">
                    <span>Total Bill Amount</span>
                    <span className="text-amber-700 font-mono">{formatBDT(selectedBill.total_amount)}</span>
                  </div>
                  {(() => {
                    const isPaid = selectedBill.status === "PAID" || (parseFloat(selectedBill.paid_amount) || 0) >= (parseFloat(selectedBill.total_amount) || 0);
                    const paid = isPaid ? selectedBill.total_amount : (selectedBill.paid_amount || 0);
                    const due = isPaid ? 0 : Math.max(0, (parseFloat(selectedBill.total_amount) || 0) - (parseFloat(selectedBill.paid_amount) || 0));
                    return (
                      <>
                        {parseFloat(paid) > 0 && (
                          <div className="flex justify-between items-center text-emerald-700 font-semibold">
                            <span>Paid to Date</span>
                            <span className="font-mono">{formatBDT(paid)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center font-bold pt-1 border-t border-slate-200">
                          <span>Balance Due</span>
                          <span className={`font-mono ${due <= 0 ? "text-emerald-600" : "text-amber-700"}`}>
                            {formatBDT(due)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Direct Bill Payment / Settlement Form inside Popup */}
                {(() => {
                  const isPaid = selectedBill.status === "PAID" || (parseFloat(selectedBill.paid_amount) || 0) >= (parseFloat(selectedBill.total_amount) || 0);
                  const due = isPaid ? 0 : Math.max(0, (parseFloat(selectedBill.total_amount) || 0) - (parseFloat(selectedBill.paid_amount) || 0));

                  if (due <= 0) {
                    return (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>This vendor bill is fully settled & paid. (Balance Due: ৳0.00)</span>
                      </div>
                    );
                  }

                  return (
                    <div className="p-3.5 sm:p-4 bg-amber-50/80 border border-amber-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                          <CreditCard className="h-4 w-4 text-amber-600" />
                          <span>Pay & Settle This Bill</span>
                        </div>
                        <span className="text-[10px] text-amber-800 font-medium">Posts to General Ledger</span>
                      </div>

                      <form onSubmit={handleModalBillPayment} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Payment Date</label>
                            <input
                              type="date"
                              required
                              value={modalPayDate}
                              onChange={(e) => setModalPayDate(e.target.value)}
                              className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-mono font-medium border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Pay Amount (৳)</label>
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
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Paid From</label>
                            <select
                              value={modalPayAccount}
                              onChange={(e) => setModalPayAccount(e.target.value)}
                              className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                            >
                              {accountList.map((acc) => (
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
                              <option value="CHEQUE">Cheque</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                          <input
                            type="text"
                            value={modalPayRef}
                            onChange={(e) => setModalPayRef(e.target.value)}
                            placeholder="Reference # or transaction ID (optional)"
                            className="w-full sm:w-1/2 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800"
                          />
                          <button
                            type="submit"
                            disabled={isSubmittingBillPay}
                            className="w-full sm:w-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{isSubmittingBillPay ? "Recording..." : `Confirm Payment (${formatBDT(parseFloat(modalPayAmount) || 0)})`}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                })()}

                {selectedBill.notes && (
                  <div className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2.5 rounded border border-amber-100">
                    <strong>Notes:</strong> {selectedBill.notes}
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBill(null)}
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
