import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DateField from "@/Components/DateField";
import Pagination from "@/Components/Pagination";
import { formatBDT, formatDate } from "@/lib/utils";
import {
  Plus,
  Search,
  ArrowDownLeft,
  X,
  Trash2,
  Printer,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
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
  const todayStr = new Date().toISOString().split("T")[0];
  const [activeTab, setActiveTab] = useState("UNPAID_INVOICES"); // 'UNPAID_INVOICES' | 'HISTORY'
  const [notification, setNotification] = useState(flash?.success || null);
  const [search, setSearch] = useState(filters?.search || "");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Modal Invoice Settlement State inside Popup
  const [modalPayAmount, setModalPayAmount] = useState("");
  const [modalPayDate, setModalPayDate] = useState(todayStr);
  const [modalPayAccount, setModalPayAccount] = useState(deposit_accounts?.[0]?.id || "");
  const [modalPayMethod, setModalPayMethod] = useState("CASH");
  const [modalPayRef, setModalPayRef] = useState("");
  const [isSubmittingInvPay, setIsSubmittingInvPay] = useState(false);

  const handleOpenInvoiceModal = (inv) => {
    setSelectedInvoice(inv);
    if (inv) {
      const isPaid = inv.status === "PAID" || (parseFloat(inv.paid_amount) || 0) >= (parseFloat(inv.total_amount) || 0);
      const due = isPaid ? 0 : Math.max(0, (parseFloat(inv.total_amount) || 0) - (parseFloat(inv.paid_amount) || 0));
      setModalPayAmount(due > 0 ? due : "");
      setModalPayDate(todayStr);
      setModalPayAccount(deposit_accounts?.[0]?.id || "");
      setModalPayMethod("CASH");
      setModalPayRef("");
    }
  };

  const handleModalInvoicePayment = (e) => {
    e.preventDefault();
    if (!selectedInvoice || !modalPayAmount || parseFloat(modalPayAmount) <= 0) return;
    setIsSubmittingInvPay(true);
    router.post(
      "/sales/payments-received",
      {
        contact_id: selectedInvoice.contact_id,
        invoice_id: selectedInvoice.id,
        amount: parseFloat(modalPayAmount),
        account_id: modalPayAccount || deposit_accounts?.[0]?.id,
        payment_date: modalPayDate || todayStr,
        payment_method: modalPayMethod,
        reference_number: modalPayRef,
        notes: `Payment received for invoice ${selectedInvoice.invoice_number}`,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSelectedInvoice(null);
          setIsSubmittingInvPay(false);
          setNotification(`✅ Receipt of ${formatBDT(modalPayAmount)} on Invoice #${selectedInvoice.invoice_number} recorded & posted!`);
        },
        onError: () => setIsSubmittingInvPay(false),
      }
    );
  };

  // Inline row payment states (for fast direct payment from table)
  const [inlineAmounts, setInlineAmounts] = useState({});
  const [inlineAccounts, setInlineAccounts] = useState({});
  const [inlineMethods, setInlineMethods] = useState({});

  // Form State for Drawer
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
  const unpaidInvoicesList = unpaid_invoices || [];
  const customerList = customers || [];
  const accountList = deposit_accounts || [];

  // Filter unpaid invoices for the drawer customer
  const customerInvoices = unpaidInvoicesList.filter(
    (inv) => String(inv.contact_id) === String(formCustomerId)
  );

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

  // Direct fast payment submission from table row
  const handleInlineReceivePayment = (inv) => {
    const balDue = Math.max(0, (parseFloat(inv.total_amount) || 0) - (parseFloat(inv.paid_amount) || 0));
    const payAmt = parseFloat(inlineAmounts[inv.id] !== undefined ? inlineAmounts[inv.id] : balDue) || 0;
    if (payAmt <= 0) {
      alert("Please enter a valid payment amount greater than 0.");
      return;
    }
    const accId = inlineAccounts[inv.id] || accountList[0]?.id;
    if (!accId) {
      alert("Please select a deposit account.");
      return;
    }
    const mode = inlineMethods[inv.id] || "CASH";

    router.post(
      "/sales/payments-received",
      {
        contact_id: inv.contact_id,
        invoice_id: inv.id,
        account_id: accId,
        payment_date: todayStr,
        amount: payAmt,
        payment_method: mode,
        notes: `Direct receipt on invoice #${inv.invoice_number}`,
      },
      {
        onSuccess: () => {
          setNotification(`✅ Received ${formatBDT(payAmt)} on Invoice #${inv.invoice_number}!`);
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
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Outstanding Invoices</span>
            <div className="text-xl font-bold text-blue-600 mt-1">{unpaidInvoicesList.length}</div>
            <span className="text-[10px] text-slate-400">Invoices ready for settlement</span>
          </div>
        </div>

        {/* Tab Switcher: Unpaid & Due Invoices vs Payments Received History */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("UNPAID_INVOICES")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
              activeTab === "UNPAID_INVOICES"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Unpaid & Due Invoices ({unpaidInvoicesList.length})</span>
            {unpaidInvoicesList.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black">
                {unpaidInvoicesList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
              activeTab === "HISTORY"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>Payments Received History ({payments?.total ?? paymentList.length})</span>
          </button>
        </div>

        {activeTab === "UNPAID_INVOICES" ? (
          /* Tab 1: Unpaid / Partial Invoices List with INLINE PAYMENT INPUTS */
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <span>Unpaid & Partially Paid Customer Invoices</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Directly enter settlement amount and click "Receive Payment" to post to General Ledger.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-100/70 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Total (BDT)</th>
                    <th className="py-3 px-4 text-right">Balance Due (BDT)</th>
                    <th className="py-3 px-4">Pay Amount (BDT)</th>
                    <th className="py-3 px-4">Deposit Account</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unpaidInvoicesList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        🎉 All customer invoices are fully settled! No pending balances.
                      </td>
                    </tr>
                  ) : (
                    unpaidInvoicesList.map((inv) => {
                      const balDue = Math.max(0, (parseFloat(inv.total_amount) || 0) - (parseFloat(inv.paid_amount) || 0));
                      const isOverdue = inv.due_date && new Date(inv.due_date) < new Date(todayStr);
                      const currentAmount = inlineAmounts[inv.id] !== undefined ? inlineAmounts[inv.id] : balDue;
                      const currentAccount = inlineAccounts[inv.id] || accountList[0]?.id;
                      const currentMethod = inlineMethods[inv.id] || "CASH";

                      return (
                        <tr key={inv.id} className="hover:bg-emerald-50/30 transition">
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">
                            <button
                              type="button"
                              onClick={() => handleOpenInvoiceModal(inv)}
                              className="hover:underline hover:text-blue-900 transition flex items-center gap-1.5 cursor-pointer text-left font-mono font-bold text-blue-600"
                              title="Click to view Invoice details & receive payment"
                            >
                              <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              <span>{inv.invoice_number}</span>
                            </button>
                            {inv.order_number && (
                              <div className="text-[10px] text-slate-400 font-normal">Ord: {inv.order_number}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{inv.contact?.name || "Customer"}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {inv.contact?.whatsapp_number || inv.contact?.phone}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>{formatDate(inv.due_date)}</div>
                            {isOverdue && (
                              <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded text-[9px] font-bold">
                                OVERDUE
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                            {formatBDT(inv.total_amount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                            {formatBDT(balDue)}
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min="0.01"
                              max={balDue}
                              step="any"
                              value={currentAmount}
                              onChange={(e) =>
                                setInlineAmounts({
                                  ...inlineAmounts,
                                  [inv.id]: e.target.value,
                                })
                              }
                              className="w-28 px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold text-right focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={currentAccount}
                              onChange={(e) =>
                                setInlineAccounts({
                                  ...inlineAccounts,
                                  [inv.id]: e.target.value,
                                })
                              }
                              className="w-32 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500"
                            >
                              {accountList.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.code} - {acc.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleInlineReceivePayment(inv)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition shadow-xs"
                              title="Record payment for this invoice"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Receive</span>
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
          /* Tab 2: Payments Received History */
          <div className="space-y-4">
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
                            <button
                              type="button"
                              onClick={() => handleOpenInvoiceModal(pay.invoice)}
                              className="text-blue-600 hover:text-blue-900 hover:underline font-semibold flex items-center gap-1.5 cursor-pointer font-mono"
                              title="Click to view Invoice details & receive payment"
                            >
                              <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              <span>{pay.invoice.invoice_number}</span>
                            </button>
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
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded"
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
                  <h2 className="text-base font-bold text-slate-900">Record Payment Received</h2>
                  <p className="text-xs text-slate-500">Record customer settlement against an invoice or direct</p>
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
                  <label className="text-xs font-semibold text-slate-700">Customer *</label>
                  <select
                    required
                    value={formCustomerId}
                    onChange={(e) => {
                      setFormCustomerId(e.target.value);
                      setFormInvoiceId("");
                    }}
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

                {customerInvoices.length > 0 && (
                  <div className="space-y-1 bg-blue-50/50 p-3 rounded-lg border border-blue-200">
                    <label className="text-xs font-bold text-blue-900">Apply to Outstanding Invoice (Optional)</label>
                    <select
                      value={formInvoiceId}
                      onChange={(e) => handleInvoiceChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-blue-300 rounded-md bg-white font-mono"
                    >
                      <option value="">-- Direct Payment (Not tied to invoice) --</option>
                      {customerInvoices.map((inv) => {
                        const rem = Math.max(0, (parseFloat(inv.total_amount) || 0) - (parseFloat(inv.paid_amount) || 0));
                        return (
                          <option key={inv.id} value={inv.id}>
                            {inv.invoice_number} (Total: {formatBDT(inv.total_amount)} | Due: {formatBDT(rem)})
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
                  <label className="text-xs font-semibold text-slate-700">Deposit To Account *</label>
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
                    placeholder="e.g. Bank slip # / Trx ID"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Notes / Remarks</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Payment remarks or receipt note..."
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
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs"
                  >
                    Save & Post Receipt
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
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="font-bold text-sm">Receipt #{selectedPayment.payment_number}</span>
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

        {/* Invoice Detail Modal Popup */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-lg max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in duration-150 flex flex-col max-h-[92vh]">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <span className="font-bold text-sm font-mono">Invoice Details - {selectedInvoice.invoice_number}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{selectedInvoice.contact?.name || "Customer"}</h3>
                    <p className="text-slate-500">{selectedInvoice.contact?.whatsapp_number || selectedInvoice.contact?.phone || "Customer Contact"}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        selectedInvoice.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {selectedInvoice.status || "CONFIRMED"}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Transaction Date: <strong>{formatDate(selectedInvoice.issue_date || selectedInvoice.created_at)}</strong>
                    </p>
                    {selectedInvoice.due_date && (
                      <p className="text-[11px] text-slate-500">
                        Due: {formatDate(selectedInvoice.due_date)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Line Items */}
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="p-2">Item / Description</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Price (৳)</th>
                        <th className="p-2 text-right">Amount (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {((selectedInvoice.line_items || selectedInvoice.lineItems || []).length > 0) ? (
                        (selectedInvoice.line_items || selectedInvoice.lineItems || []).map((li, i) => (
                          <tr key={i}>
                            <td className="p-2 font-medium text-slate-800">{li.description}</td>
                            <td className="p-2 text-center font-mono">{li.quantity}</td>
                            <td className="p-2 text-right font-mono">{formatBDT(li.unit_price)}</td>
                            <td className="p-2 text-right font-semibold font-mono">{formatBDT(li.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="p-2 font-medium text-slate-800">Sales Invoice Item / Service</td>
                          <td className="p-2 text-center font-mono">1</td>
                          <td className="p-2 text-right font-mono">{formatBDT(selectedInvoice.total_amount)}</td>
                          <td className="p-2 text-right font-semibold font-mono">{formatBDT(selectedInvoice.total_amount)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Totals */}
                <div className="bg-slate-50 p-3.5 rounded-md space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between items-center font-bold text-sm text-slate-900">
                    <span>Total Invoice Amount</span>
                    <span className="text-blue-700 font-mono">{formatBDT(selectedInvoice.total_amount)}</span>
                  </div>
                  {(() => {
                    const isPaid = selectedInvoice.status === "PAID" || (parseFloat(selectedInvoice.paid_amount) || 0) >= (parseFloat(selectedInvoice.total_amount) || 0);
                    const paid = isPaid ? selectedInvoice.total_amount : (selectedInvoice.paid_amount || 0);
                    const due = isPaid ? 0 : Math.max(0, (parseFloat(selectedInvoice.total_amount) || 0) - (parseFloat(selectedInvoice.paid_amount) || 0));
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

                {/* Direct Invoice Receipt / Settlement Form inside Popup */}
                {(() => {
                  const isPaid = selectedInvoice.status === "PAID" || (parseFloat(selectedInvoice.paid_amount) || 0) >= (parseFloat(selectedInvoice.total_amount) || 0);
                  const due = isPaid ? 0 : Math.max(0, (parseFloat(selectedInvoice.total_amount) || 0) - (parseFloat(selectedInvoice.paid_amount) || 0));

                  if (due <= 0) {
                    return (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>This sales invoice is fully settled & paid. (Balance Due: ৳0.00)</span>
                      </div>
                    );
                  }

                  return (
                    <div className="p-3.5 sm:p-4 bg-emerald-50/80 border border-emerald-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-950">
                          <CreditCard className="h-4 w-4 text-emerald-600" />
                          <span>Receive Payment for This Invoice</span>
                        </div>
                        <span className="text-[10px] text-emerald-800 font-medium">Posts to General Ledger</span>
                      </div>

                      <form onSubmit={handleModalInvoicePayment} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Payment Date *</label>
                            <input
                              type="date"
                              required
                              value={modalPayDate}
                              onChange={(e) => setModalPayDate(e.target.value)}
                              className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Receipt Amount (৳) *</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              min="0.01"
                              max={due}
                              value={modalPayAmount}
                              onChange={(e) => setModalPayAmount(e.target.value)}
                              className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Deposit To Account</label>
                            <select
                              value={modalPayAccount}
                              onChange={(e) => setModalPayAccount(e.target.value)}
                              className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500"
                            >
                              {accountList.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.name} ({acc.code})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Payment Method</label>
                            <select
                              value={modalPayMethod}
                              onChange={(e) => setModalPayMethod(e.target.value)}
                              className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500"
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
                            placeholder="Reference # or check ID (optional)"
                            className="w-full sm:w-1/2 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800"
                          />
                          <button
                            type="submit"
                            disabled={isSubmittingInvPay}
                            className="w-full sm:w-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{isSubmittingInvPay ? "Recording..." : `Confirm Receipt (${formatBDT(parseFloat(modalPayAmount) || 0)})`}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                })()}

                {selectedInvoice.notes && (
                  <div className="text-[11px] text-slate-500 italic bg-blue-50/50 p-2.5 rounded border border-blue-100">
                    <strong>Notes:</strong> {selectedInvoice.notes}
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
                  <span>Print Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
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
