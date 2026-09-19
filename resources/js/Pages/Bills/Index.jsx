import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import {
  Plus,
  Search,
  Receipt,
  CheckCircle2,
  Printer,
  Trash2,
  X,
  Edit,
  Phone,
  Calendar,
} from "lucide-react";
import { Head, router, usePage } from "@inertiajs/react";

export default function BillsIndex({ bills, vendors, items }) {
  const { flash } = usePage().props;
  const billList = bills?.data || bills || [];
  const vendorList = vendors || [];

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [notification, setNotification] = useState(flash?.success || null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [vendorName, setVendorName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0]
  );
  const [status, setStatus] = useState("RECEIVED");
  const [notes, setNotes] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [lineItems, setLineItems] = useState([
    { description: "", quantity: 1, unit_price: 0, amount: 0 },
  ]);

  const resetForm = () => {
    setEditingBillId(null);
    setVendorName("");
    setWhatsappNumber("");
    setBillDate(new Date().toISOString().split("T")[0]);
    setDueDate(new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0]);
    setStatus("RECEIVED");
    setNotes("");
    setDiscountAmount(0);
    setLineItems([{ description: "", quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const handleOpenCreateDrawer = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (bill) => {
    setEditingBillId(bill.id);
    setVendorName(bill.contact?.name || "");
    setWhatsappNumber(bill.contact?.whatsapp_number || bill.contact?.phone || "");
    setBillDate(bill.bill_date ? bill.bill_date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setDueDate(bill.due_date ? bill.due_date.split("T")[0] : "");
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

  const subtotalBDT = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalBDT = Math.max(0, subtotalBDT - (parseFloat(discountAmount) || 0));

  const handleSubmitBill = (e) => {
    e.preventDefault();
    const payload = {
      contact_name: vendorName,
      whatsapp_number: whatsappNumber,
      bill_date: billDate,
      due_date: dueDate,
      status: status,
      subtotal: subtotalBDT,
      discount_amount: parseFloat(discountAmount) || 0,
      total_amount: totalBDT,
      notes: notes,
      line_items: lineItems,
    };

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
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search bill # or vendor..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md w-48 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <button
              onClick={handleOpenCreateDrawer}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              <span>New Bill</span>
            </button>
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
                  <th className="py-2.5 px-4 text-right">Amount (BDT)</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No bills recorded yet. Click <strong>+ New Bill</strong> to add a vendor bill.
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBill(b)}
                      className="hover:bg-amber-50/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-600">{b.bill_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{b.contact?.name || "Vendor"}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {b.bill_date ? new Date(b.bill_date).toLocaleDateString("en-GB") : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {b.due_date ? new Date(b.due_date).toLocaleDateString("en-GB") : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            b.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatBDT(b.total_amount)}</td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEditDrawer(b)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition"
                          title="Edit Bill"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bill Date *</label>
                  <input
                    type="date"
                    required
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="RECEIVED">RECEIVED</option>
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

                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-md border border-slate-200">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Item Description"
                        required
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
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
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Price"
                        value={item.unit_price}
                        onChange={(e) => handleLineItemChange(index, "unit_price", e.target.value)}
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md text-right"
                      />
                    </div>
                    <div className="col-span-2 font-bold text-xs text-right text-slate-900 pr-1">
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-400" />
                <span className="font-bold text-sm font-mono">{selectedBill.bill_number}</span>
              </div>
              <button onClick={() => setSelectedBill(null)} className="text-slate-400 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
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
                    Date: {selectedBill.bill_date ? new Date(selectedBill.bill_date).toLocaleDateString("en-GB") : "N/A"}
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

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md font-bold text-sm text-slate-900">
                <span>Total Payable Amount</span>
                <span className="text-amber-700">{formatBDT(selectedBill.total_amount)}</span>
              </div>

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
