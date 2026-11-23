import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DateField from "@/Components/DateField";
import Pagination from "@/Components/Pagination";
import { formatBDT, formatDate } from "@/lib/utils";
import {
  Plus,
  Search,
  Receipt,
  CreditCard,
  CheckCircle2,
  Printer,
  Trash2,
  X,
  Edit,
  Phone,
  Calendar,
} from "lucide-react";
import { Head, router, usePage } from "@inertiajs/react";

export default function BillsIndex({ bills, vendors, items, deposit_accounts, filters }) {
  const { flash } = usePage().props;
  const billList = bills?.data || bills || [];
  const vendorList = vendors || [];
  const accountsList = deposit_accounts || [];

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [notification, setNotification] = useState(flash?.success || null);
  const [searchTerm, setSearchTerm] = useState(filters?.search || "");
  const [statusFilter, setStatusFilter] = useState(filters?.status || "ALL");

  // Modal Direct Payment State
  const [modalPayAmount, setModalPayAmount] = useState("");
  const [modalPayAccount, setModalPayAccount] = useState("");
  const [modalPayMethod, setModalPayMethod] = useState("CASH");
  const [modalPayRef, setModalPayRef] = useState("");
  const [isSubmittingBillPay, setIsSubmittingBillPay] = useState(false);

  const handleSelectBill = (b) => {
    setSelectedBill(b);
    if (b) {
      const isPaid = b.status === "PAID" || (parseFloat(b.paid_amount) || 0) >= (parseFloat(b.total_amount) || 0);
      const due = isPaid ? 0 : Math.max(0, (parseFloat(b.total_amount) || 0) - (parseFloat(b.paid_amount) || 0));
      setModalPayAmount(due > 0 ? due.toFixed(2) : "");
      setModalPayAccount(accountsList[0]?.id || "");
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
        account_id: modalPayAccount || accountsList[0]?.id,
        payment_method: modalPayMethod,
        payment_date: new Date().toISOString().split("T")[0],
        reference_number: modalPayRef,
        notes: `Payment for bill ${selectedBill.bill_number}`,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSelectedBill(null);
          setIsSubmittingBillPay(false);
          setNotification("✅ Vendor payment recorded successfully!");
        },
        onError: () => setIsSubmittingBillPay(false),
      }
    );
  };

  const handleFilter = (st) => {
    setStatusFilter(st);
    router.get("/bills", { search: searchTerm, status: st }, { preserveState: true, replace: true });
  };

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    router.get("/bills", { search: val, status: statusFilter }, { preserveState: true, replace: true });
  };

  const addDays = (dateStr, days = 2) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Form state
  const todayStr = new Date().toISOString().split("T")[0];
  const [vendorName, setVendorName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [billDate, setBillDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(addDays(todayStr, 2));
  const [status, setStatus] = useState("RECEIVED");
  const [notes, setNotes] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [lineItems, setLineItems] = useState([
    { description: "", quantity: 1, unit_price: 0, amount: 0 },
  ]);

  // Initial Payment / Deposit State
  const [recordInitialPayment, setRecordInitialPayment] = useState(false);
  const [formInitialPayment, setFormInitialPayment] = useState("");
  const [formPaymentAccount, setFormPaymentAccount] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState("CASH");
  const [formPaymentRef, setFormPaymentRef] = useState("");

  const handleBillDateChange = (newDate) => {
    setBillDate(newDate);
    if (newDate) {
      setDueDate(addDays(newDate, 2));
    }
  };

  const resetForm = () => {
    setEditingBillId(null);
    setVendorName("");
    setWhatsappNumber("");
    const today = new Date().toISOString().split("T")[0];
    setBillDate(today);
    setDueDate(addDays(today, 2));
    setStatus("UNPAID");
    setNotes("");
    setDiscountAmount(0);
    setLineItems([{ description: "", quantity: 1, unit_price: 0, amount: 0 }]);
    setRecordInitialPayment(false);
    setFormInitialPayment("");
    setFormPaymentAccount(accountsList[0]?.id || "");
    setFormPaymentMethod("CASH");
    setFormPaymentRef("");
  };

  const handleOpenCreateDrawer = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (bill) => {
    setEditingBillId(bill.id);
    setVendorName(bill.contact?.name || "");
    setWhatsappNumber(bill.contact?.whatsapp_number || bill.contact?.phone || "");
    const bDate = bill.bill_date ? bill.bill_date.split("T")[0] : new Date().toISOString().split("T")[0];
    setBillDate(bDate);
    setDueDate(bill.due_date ? bill.due_date.split("T")[0] : addDays(bDate, 2));
    setStatus(bill.status || "RECEIVED");
    setNotes(bill.notes || "");
    setDiscountAmount(bill.discount_amount || 0);

    const items = bill.line_items || bill.lineItems || [];
    if (items.length > 0) {
      setLineItems(
        items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          amount: it.amount,
        }))
      );
    } else {
      setLineItems([{ description: "Expense item", quantity: 1, unit_price: bill.total_amount || 0, amount: bill.total_amount || 0 }]);
    }

    setSelectedBill(null);
    setIsDrawerOpen(true);
  };

  const handleSelectVendor = (name) => {
    setVendorName(name);
    const matched = vendorList.find((v) => v.name.toLowerCase() === name.toLowerCase());
    if (matched && (matched.whatsapp_number || matched.phone)) {
      setWhatsappNumber(matched.whatsapp_number || matched.phone);
    }
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unit_price: 0, amount: 0 },
    ]);
  };

  const handleRemoveLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index, field, val) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: val };
    if (field === "quantity" || field === "unit_price") {
      item.amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    }
    updated[index] = item;
    setLineItems(updated);
  };

  const handleProductSelect = (index, val) => {
    const matchedItem = (items || []).find(
      (it) => it.name.toLowerCase() === val.toLowerCase() || (it.sku && it.sku.toLowerCase() === val.toLowerCase())
    );
    const updated = [...lineItems];
    if (matchedItem) {
      const qty = parseFloat(updated[index].quantity) || 1;
      const rate = parseFloat(matchedItem.purchase_price || matchedItem.cost_price || matchedItem.sales_price) || 0;
      updated[index] = {
        ...updated[index],
        item_id: matchedItem.id,
        description: matchedItem.name,
        unit_price: rate,
        amount: qty * rate,
      };
    } else {
      updated[index] = { ...updated[index], description: val };
    }
    setLineItems(updated);
  };

  const subtotalBDT = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalBDT = Math.max(0, subtotalBDT - (parseFloat(discountAmount) || 0));

  const handleSubmitBill = (e) => {
    e.preventDefault();
    const payload = {
      contact_name: vendorName,
      whatsapp_number: whatsappNumber,
      bill_date: billDate,
      due_date: dueDate,
      status: status === "RECEIVED" ? "UNPAID" : status,
      subtotal: subtotalBDT,
      discount_amount: parseFloat(discountAmount) || 0,
      total_amount: totalBDT,
      notes: notes,
      line_items: lineItems,
    };

    if (!editingBillId && recordInitialPayment && (parseFloat(formInitialPayment) || 0) > 0) {
      payload.deposit_amount = parseFloat(formInitialPayment) || 0;
      if (formPaymentAccount) payload.deposit_account_id = formPaymentAccount;
      payload.deposit_payment_method = formPaymentMethod;
      if (formPaymentRef) payload.deposit_reference = formPaymentRef;
    }

    if (editingBillId) {
      router.post(`/bills/${editingBillId}`, payload, {
        onSuccess: () => {
          setIsDrawerOpen(false);
          resetForm();
          setNotification("✅ Vendor Bill updated successfully!");
        },
      });
    } else {
      router.post("/bills", payload, {
        onSuccess: () => {
          setIsDrawerOpen(false);
          resetForm();
          setNotification("✅ Vendor Bill recorded and posted to general ledger!");
        },
      });
    }
  };

  const handleMarkAsPaid = (billId) => {
    router.post(
      `/bills/${billId}/mark-paid`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          setSelectedBill(null);
          setNotification("✅ Vendor Bill marked as PAID.");
        },
      }
    );
  };

  const filteredBills = billList.filter((b) => {
    const name = b.contact?.name || "";
    const num = b.bill_number || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || num.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <AuthenticatedLayout>
      <Head title="Bills & Vendor Expenses - Nefco Books" />

      <div className="space-y-6">
        {notification && (
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg shadow-xs">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-600" />
              <span>Bills & Purchases</span>
            </h1>
            <p className="text-xs text-slate-500">Record and manage vendor bills & expenses in Bangladeshi Taka (৳)</p>
          </div>
          <button
            onClick={handleOpenCreateDrawer}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Bill</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {["ALL", "UNPAID", "PARTIALLY PAID", "PAID", "OVERDUE"].map((st) => (
              <button
                key={st}
                onClick={() => handleFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  statusFilter === st
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search bill # or vendor..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md w-56 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Vendor Bills Ledger</h2>
            <span className="text-[11px] text-slate-500 font-mono">Double-Entry: Debit Expenses (6000) | Credit AP (2000)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="bg-slate-100/70 uppercase font-semibold text-[10px] text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Bill #</th>
                  <th className="py-2.5 px-4">Vendor Name</th>
                  <th className="py-2.5 px-4">Bill Date</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Total (BDT)</th>
                  <th className="py-2.5 px-4 text-right">Balance Due (BDT)</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No bills recorded yet. Click <strong>+ New Bill</strong> to add a vendor bill.
                    </td>
                  </tr>
                ) : (
                  billList.map((b) => {
                    const isPaid = b.status === "PAID" || (parseFloat(b.paid_amount) || 0) >= (parseFloat(b.total_amount) || 0);
                    const balanceDue = isPaid ? 0 : Math.max(0, (parseFloat(b.total_amount) || 0) - (parseFloat(b.paid_amount) || 0));
                    return (
                      <tr
                        key={b.id}
                        onClick={() => handleSelectBill(b)}
                        className="hover:bg-amber-50/40 cursor-pointer transition"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-amber-600">{b.bill_number}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{b.contact?.name || "Vendor"}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {formatDate(b.bill_date)}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {formatDate(b.due_date)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800"
                                : b.status === "PARTIALLY_PAID"
                                ? "bg-amber-100 text-amber-800"
                                : b.status === "OVERDUE"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {isPaid ? "PAID" : (b.status === "PARTIALLY_PAID" ? "PARTIALLY PAID" : (b.status === "RECEIVED" ? "UNPAID" : b.status))}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{formatBDT(b.total_amount)}</td>
                        <td className="py-3 px-4 text-right font-bold">
                          <span className={balanceDue <= 0 ? "text-emerald-600 font-mono" : "text-amber-700 font-mono"}>
                            {formatBDT(balanceDue)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditDrawer(b)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded border border-amber-200 transition inline-flex items-center gap-1 shadow-xs"
                              title="Edit Bill"
                            >
                              <Edit className="h-3 w-3" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 15-Row Pagination */}
          <Pagination meta={bills} />
        </div>
      </div>

      {/* Slide-out Drawer: New / Edit Vendor Bill */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-400" />
                <h2 className="font-bold text-sm">
                  {editingBillId ? "Edit Vendor Bill" : "New Vendor Bill (Purchases)"}
                </h2>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmitBill} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    list="vendors-list"
                    value={vendorName}
                    onChange={(e) => handleSelectVendor(e.target.value)}
                    placeholder="Select or type vendor name..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <datalist id="vendors-list">
                    {vendorList.map((v) => (
                      <option key={v.id} value={v.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile / WhatsApp Number</label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+88017..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <DateField
                  label="Bill Date *"
                  required
                  value={billDate}
                  onChange={handleBillDateChange}
                  colorScheme="amber"
                />

                <DateField
                  label="Due Date"
                  value={dueDate}
                  onChange={setDueDate}
                  helperText="Default: 2 days after bill date"
                  colorScheme="amber"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status === "RECEIVED" ? "UNPAID" : status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="UNPAID">UNPAID</option>
                    <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Term / Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Net 15 days"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-800">Purchased Items & Expenses</h3>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                {/* Catalog items datalist */}
                <datalist id="bill-catalog-items">
                  {(items || []).map((it) => (
                    <option key={it.id} value={it.name}>
                      {it.sku ? `[${it.sku}] ` : ""}{formatBDT(it.purchase_price || it.cost_price || it.sales_price)} / {it.unit}
                    </option>
                  ))}
                </datalist>

                {/* Table Header for Input Boxes */}
                <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-slate-500 px-2 py-1 bg-slate-100 rounded">
                  <div className="col-span-5">Item Details</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-1 text-center"></div>
                </div>

                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-md border border-slate-200">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Type or select purchased item..."
                        required
                        list="bill-catalog-items"
                        value={item.description}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, "quantity", e.target.value)}
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md text-center font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Rate"
                        value={item.unit_price}
                        onChange={(e) => handleLineItemChange(index, "unit_price", e.target.value)}
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md text-right font-mono"
                      />
                    </div>
                    <div className="col-span-2 font-bold text-xs text-right text-slate-900 pr-1 font-mono">
                      {formatBDT(item.amount)}
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(index)}
                        className="text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost Summary Breakdown */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatBDT(subtotalBDT)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Discount (BDT)</span>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-24 text-xs px-2 py-1 border border-slate-200 rounded-md text-right"
                  />
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                  <span>Total Payable Amount</span>
                  <span className="text-amber-700">{formatBDT(totalBDT)}</span>
                </div>
              </div>

              {/* Initial Payment / Deposit */}
              {!editingBillId && (
                <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800">Initial Payment (Paid Upfront)</span>
                      <p className="text-[11px] text-slate-500">Record partial or full initial payment for this bill</p>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recordInitialPayment}
                        onChange={(e) => {
                          setRecordInitialPayment(e.target.checked);
                          if (e.target.checked && (!formInitialPayment || formInitialPayment <= 0)) {
                            setFormInitialPayment(totalBDT);
                          }
                        }}
                        className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                      />
                      <span className="text-xs font-semibold text-slate-700">Record Payment</span>
                    </label>
                  </div>

                  {recordInitialPayment && (
                    <div className="space-y-3 pt-2 border-t border-amber-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Payment Amount (BDT) *</label>
                          <input
                            type="number"
                            min="0.01"
                            max={totalBDT}
                            step="any"
                            value={formInitialPayment}
                            onChange={(e) => setFormInitialPayment(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Paid From Account *</label>
                          <select
                            value={formPaymentAccount}
                            onChange={(e) => setFormPaymentAccount(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
                          >
                            {accountsList.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.code} - {acc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Payment Method</label>
                          <select
                            value={formPaymentMethod}
                            onChange={(e) => setFormPaymentMethod(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
                          >
                            <option value="CASH">CASH</option>
                            <option value="BANK_TRANSFER">BANK TRANSFER</option>
                            <option value="CHEQUE">CHEQUE</option>
                            <option value="MOBILE_BANKING">MOBILE BANKING (bKash/Nagad)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Reference / Trx ID</label>
                          <input
                            type="text"
                            placeholder="Cheque # / Trx ID"
                            value={formPaymentRef}
                            onChange={(e) => setFormPaymentRef(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                          />
                        </div>
                      </div>

                      <div className="text-[11px] text-amber-800 font-semibold bg-amber-100/70 p-2 rounded">
                        {parseFloat(formInitialPayment) >= totalBDT ? (
                          <span>✅ Full payment will mark bill as <strong>PAID</strong> (Balance Due: ৳0.00).</span>
                        ) : (
                          <span>⚠️ Partial payment will mark bill as <strong>PARTIALLY PAID</strong> (Remaining Due: {formatBDT(Math.max(0, totalBDT - (parseFloat(formInitialPayment) || 0)))}).</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold shadow-xs transition"
                >
                  {editingBillId ? "Save Bill Changes" : "Confirm & Post Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Detail Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in duration-150 flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-400" />
                <span className="font-bold text-sm font-mono">{selectedBill.bill_number}</span>
              </div>
              <button onClick={() => setSelectedBill(null)} className="text-slate-400 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selectedBill.contact?.name}</h3>
                  <p className="text-slate-500">{selectedBill.contact?.whatsapp_number || selectedBill.contact?.phone || "Vendor"}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      selectedBill.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {selectedBill.status}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Date: {formatDate(selectedBill.bill_date || selectedBill.issue_date)}
                  </p>
                </div>
              </div>

              {/* Line Items */}
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedBill.line_items || selectedBill.lineItems || []).map((li, i) => (
                      <tr key={i}>
                        <td className="p-2">{li.description}</td>
                        <td className="p-2 text-center">{li.quantity}</td>
                        <td className="p-2 text-right">{formatBDT(li.unit_price)}</td>
                        <td className="p-2 text-right font-semibold">{formatBDT(li.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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

              {/* Direct Bill Payment / Settlement Form */}
              {(() => {
                const isPaid = selectedBill.status === "PAID" || (parseFloat(selectedBill.paid_amount) || 0) >= (parseFloat(selectedBill.total_amount) || 0);
                const due = isPaid ? 0 : Math.max(0, (parseFloat(selectedBill.total_amount) || 0) - (parseFloat(selectedBill.paid_amount) || 0));

                if (due <= 0) {
                  return (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>This vendor bill is fully paid. (Balance Due: ৳0.00)</span>
                    </div>
                  );
                }

                return (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                        <span>Make Payment / Settle Bill</span>
                      </div>
                      <span className="text-[10px] text-amber-800 font-medium">Posts to General Ledger</span>
                    </div>

                    <form onSubmit={handleModalBillPayment} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase">Payment Amount (৳)</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            max={due}
                            value={modalPayAmount}
                            onChange={(e) => setModalPayAmount(e.target.value)}
                            className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase">Paid From Account</label>
                          <select
                            value={modalPayAccount}
                            onChange={(e) => setModalPayAccount(e.target.value)}
                            className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                          >
                            {accountsList.map((acc) => (
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
                            className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="CASH">Cash</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="MOBILE_BANKING">Mobile Banking</option>
                            <option value="CHEQUE">Cheque</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                        <input
                          type="text"
                          value={modalPayRef}
                          onChange={(e) => setModalPayRef(e.target.value)}
                          placeholder="Reference # or check/transaction ID"
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
                <p className="text-slate-500 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                  Note: {selectedBill.notes}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 border border-slate-200 rounded-md"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => handleOpenEditDrawer(selectedBill)}
                    className="flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 font-semibold px-3 py-1.5 border border-amber-200 rounded-md bg-amber-50"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit Bill</span>
                  </button>
                </div>

                {selectedBill.id && selectedBill.status !== "PAID" && (
                  <button
                    onClick={() => handleMarkAsPaid(selectedBill.id)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-md shadow-xs"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Mark as PAID</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
