import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DateField from "@/Components/DateField";
import { formatBDT, formatDate } from "@/lib/utils";
import {
  Plus,
  Search,
  Receipt,
  X,
  Send,
  Trash2,
  Printer,
  Paperclip,
  TrendingDown,
  Filter,
} from "lucide-react";
import { Head, router, usePage } from "@inertiajs/react";

export default function ExpensesIndex({
  expenses,
  expense_accounts,
  paid_through_accounts,
  vendors,
  categories,
  next_expense_number,
  metrics,
  filters,
}) {
  const { flash } = usePage().props;
  const [notification, setNotification] = useState(flash?.success || null);
  const [search, setSearch] = useState(filters?.search || "");
  const [selectedCategory, setSelectedCategory] = useState(filters?.category || "ALL");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [formExpenseNumber, setFormExpenseNumber] = useState(next_expense_number || "");
  const [formExpenseDate, setFormExpenseDate] = useState(todayStr);
  const [formExpenseAccountId, setFormExpenseAccountId] = useState(expense_accounts?.[0]?.id || "");
  const [formPaidThroughAccountId, setFormPaidThroughAccountId] = useState(paid_through_accounts?.[0]?.id || "");
  const [formAmount, setFormAmount] = useState("");
  const [formContactId, setFormContactId] = useState("");
  const [formCategory, setFormCategory] = useState(categories?.[0] || "Office Supplies & Stationery");
  const [formCustomCategory, setFormCustomCategory] = useState("");
  const [formReferenceNumber, setFormReferenceNumber] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formAttachments, setFormAttachments] = useState([]);

  const expenseList = expenses?.data || expenses || [];
  const vendorList = vendors || [];
  const expAccounts = expense_accounts || [];
  const paidAccounts = paid_through_accounts || [];
  const categoryList = categories || [];

  const handleOpenCreateDrawer = () => {
    setFormExpenseNumber(next_expense_number || `EXP-${new Date().getFullYear()}-0001`);
    setFormExpenseDate(todayStr);
    setFormExpenseAccountId(expense_accounts?.[0]?.id || "");
    setFormPaidThroughAccountId(paid_through_accounts?.[0]?.id || "");
    setFormAmount("");
    setFormContactId("");
    setFormCategory(categories?.[0] || "Office Supplies & Stationery");
    setFormCustomCategory("");
    setFormReferenceNumber("");
    setFormNotes("");
    setFormAttachments([]);
    setIsDrawerOpen(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get(
      "/purchases/expenses",
      { search, category: selectedCategory },
      { preserveState: true, replace: true }
    );
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    router.get(
      "/purchases/expenses",
      { search: val, category: selectedCategory },
      { preserveState: true, replace: true }
    );
  };

  const handleCategoryFilter = (cat) => {
    setSelectedCategory(cat);
    router.get(
      "/purchases/expenses",
      { search, category: cat },
      { preserveState: true, replace: true }
    );
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formAttachments.length > 5) {
      alert("Maximum 5 receipt files allowed.");
      return;
    }
    setFormAttachments((prev) => [...prev, ...files].slice(0, 5));
  };

  const handleRemoveFile = (idx) => {
    setFormAttachments(formAttachments.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCategory = formCategory === "OTHER" ? formCustomCategory : formCategory;
    const formData = new FormData();
    formData.append("expense_number", formExpenseNumber);
    formData.append("expense_date", formExpenseDate);
    formData.append("expense_account_id", formExpenseAccountId);
    formData.append("paid_through_account_id", formPaidThroughAccountId);
    formData.append("amount", parseFloat(formAmount) || 0);
    if (formContactId) formData.append("contact_id", formContactId);
    formData.append("category", finalCategory || "Operating Expense");
    if (formReferenceNumber) formData.append("reference_number", formReferenceNumber);
    if (formNotes) formData.append("notes", formNotes);

    formAttachments.forEach((f) => {
      formData.append("attachments[]", f);
    });

    router.post("/purchases/expenses", formData, {
      onSuccess: () => {
        setIsDrawerOpen(false);
        setNotification("✅ Operating expense recorded and posted to General Ledger!");
      },
    });
  };

  const handleDelete = (id, number) => {
    if (confirm(`Are you sure you want to delete Expense #${number}? This will reverse the ledger entry and restore account balances.`)) {
      router.delete(`/purchases/expenses/${id}`, {
        onSuccess: () => setNotification("Expense deleted and ledger updated."),
      });
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title="Operating Expenses - Purchases - Nefco Books" />

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
              <Receipt className="h-5 w-5 text-amber-600" />
              <span>Operating Expenses</span>
            </h1>
            <p className="text-xs text-slate-500">Record, track, and manage company operating costs (Rent, Salaries, Utilities, Supplies) in BDT (৳)</p>
          </div>
          <button
            onClick={handleOpenCreateDrawer}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Record Expense</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Operating Expenses</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{formatBDT(metrics?.total_expenses || 0)}</div>
            <span className="text-[10px] text-slate-400">All-time direct expenditures</span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">This Month</span>
            <div className="text-xl font-bold text-amber-600 mt-1">{formatBDT(metrics?.this_month_expenses || 0)}</div>
            <span className="text-[10px] text-slate-400">Expended during current month</span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Recorded Expenses</span>
            <div className="text-xl font-bold text-blue-600 mt-1">{metrics?.count || 0}</div>
            <span className="text-[10px] text-slate-400">Individual expense entries</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => handleCategoryFilter("ALL")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition shrink-0 ${
                selectedCategory === "ALL"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Expenses
            </button>
            {categoryList.slice(0, 4).map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryFilter(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition shrink-0 truncate max-w-[160px] ${
                  selectedCategory === cat
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                title={cat}
              >
                {cat}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search expense #, category, payee..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md w-64 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </form>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
              <tr>
                <th className="py-3 px-4">Expense #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payee / Vendor</th>
                <th className="py-3 px-4">Paid Through</th>
                <th className="py-3 px-4 text-right">Amount (BDT)</th>
                <th className="py-3 px-4 text-center">Receipt</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenseList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No operating expenses recorded yet. Click <strong>+ Record Expense</strong> to log one.
                  </td>
                </tr>
              ) : (
                expenseList.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">
                      <div>{exp.expense_number}</div>
                      {exp.reference_number && (
                        <div className="text-[10px] text-slate-400 font-normal">Ref: {exp.reference_number}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {formatDate(exp.expense_date)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-amber-50 text-amber-800 border border-amber-200 inline-block">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {exp.contact ? (
                        <div>
                          <div className="font-semibold text-slate-900">{exp.contact.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{exp.contact.phone}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Direct Operating Cost</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {exp.paid_through_account?.name || "Cash / Bank"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      {formatBDT(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {exp.attachments && exp.attachments.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                          <Paperclip className="h-3 w-3" />
                          <span>{exp.attachments.length}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center space-x-1.5">
                      <button
                        onClick={() => setSelectedExpense(exp)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                      >
                        Voucher
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id, exp.expense_number)}
                        className="p-1 text-slate-400 hover:text-red-600 transition"
                        title="Delete Expense"
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

        {/* Record Expense Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Record Operating Expense</h2>
                  <p className="text-xs text-slate-500">Operating overhead, rent, utility, salary or office expenses (BDT ৳)</p>
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
                    <label className="text-xs font-semibold text-slate-700">Expense Number</label>
                    <input
                      type="text"
                      required
                      value={formExpenseNumber}
                      onChange={(e) => setFormExpenseNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>

                  <DateField
                    label="Expense Date *"
                    required
                    value={formExpenseDate}
                    onChange={setFormExpenseDate}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Expense Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  >
                    {categoryList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="OTHER">+ Other (Custom Operating Category)</option>
                  </select>
                </div>

                {formCategory === "OTHER" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Specify Custom Category *</label>
                    <input
                      type="text"
                      required
                      value={formCustomCategory}
                      onChange={(e) => setFormCustomCategory(e.target.value)}
                      placeholder="e.g. Courier & Delivery charges"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Expense Account *</label>
                    <select
                      required
                      value={formExpenseAccountId}
                      onChange={(e) => setFormExpenseAccountId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    >
                      {expAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Amount (BDT) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Paid Through Account *</label>
                    <select
                      required
                      value={formPaidThroughAccountId}
                      onChange={(e) => setFormPaidThroughAccountId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    >
                      {paidAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Vendor / Payee (Optional)</label>
                    <select
                      value={formContactId}
                      onChange={(e) => setFormContactId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                    >
                      <option value="">-- None / General Payee --</option>
                      {vendorList.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.phone ? `(${v.phone})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Reference / Bill / Voucher #</label>
                  <input
                    type="text"
                    value={formReferenceNumber}
                    onChange={(e) => setFormReferenceNumber(e.target.value)}
                    placeholder="e.g. Receipt #, Cash memo #, Voucher #..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Description / Notes</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Expense details or business purpose..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>

                {/* Attach Receipt Slips */}
                <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800">Attach Receipt / Bills</span>
                      <p className="text-[10px] text-slate-400">Upload expense slips, vouchers, or photos (Max 5 files)</p>
                    </div>
                    <label className="cursor-pointer px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold shadow-xs">
                      Choose
                      <input type="file" multiple className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>

                  {formAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formAttachments.map((f, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded text-[11px]">
                          <span className="truncate max-w-[120px] font-mono">{f.name}</span>
                          <button type="button" onClick={() => handleRemoveFile(idx)} className="text-red-500 hover:text-red-700">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
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
                    className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-md transition shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Save Operating Expense</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Expense Voucher Modal */}
        {selectedExpense && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-amber-400" />
                  <span className="font-bold text-sm">Expense Voucher - {selectedExpense.expense_number}</span>
                </div>
                <button onClick={() => setSelectedExpense(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs text-slate-700">
                <div className="text-center pb-4 border-b border-slate-200">
                  <div className="text-xl font-bold text-slate-900 tracking-tight">EXPENSE VOUCHER</div>
                  <div className="text-xs font-semibold text-amber-600 mt-1">{selectedExpense.category}</div>
                  <div className="text-2xl font-bold text-slate-900 mt-3 font-mono">{formatBDT(selectedExpense.amount)}</div>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Paid & Posted to Ledger ✓
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expense Number:</span>
                    <span className="font-mono font-semibold">{selectedExpense.expense_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expense Date:</span>
                    <span className="font-mono">{formatDate(selectedExpense.expense_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expense Account:</span>
                    <span className="font-medium">{selectedExpense.expense_account?.name} ({selectedExpense.expense_account?.code})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paid Through:</span>
                    <span className="font-medium text-slate-800">{selectedExpense.paid_through_account?.name}</span>
                  </div>
                  {selectedExpense.contact && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payee / Vendor:</span>
                      <span className="font-semibold text-slate-800">{selectedExpense.contact.name}</span>
                    </div>
                  )}
                  {selectedExpense.reference_number && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reference #:</span>
                      <span className="font-mono">{selectedExpense.reference_number}</span>
                    </div>
                  )}
                  {selectedExpense.notes && (
                    <div className="pt-2 text-slate-500 border-t border-slate-100">
                      <strong>Notes:</strong> {selectedExpense.notes}
                    </div>
                  )}

                  {selectedExpense.attachments && selectedExpense.attachments.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <div className="font-bold text-[11px] text-slate-700 mb-1 flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5 text-amber-600" />
                        <span>Attached Receipts ({selectedExpense.attachments.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedExpense.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-[11px] font-mono text-blue-600"
                          >
                            <span>📎</span>
                            <span className="truncate max-w-[120px]">{att.name}</span>
                          </a>
                        ))}
                      </div>
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
                  onClick={() => setSelectedExpense(null)}
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
