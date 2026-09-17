import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { Landmark, Plus, BookOpen, ArrowUpRight, ArrowDownLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { Head, useForm } from "@inertiajs/react";

export default function BankingIndex({ accounts, allAccounts, recentJournals }) {
  const [showModal, setShowModal] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    reference: "",
    description: "",
    lines: [
      { account_code: allAccounts?.[0]?.code || "", debit: "", credit: "" },
      { account_code: allAccounts?.[1]?.code || "", debit: "", credit: "" },
    ],
  });

  const addLine = () => {
    setData("lines", [...data.lines, { account_code: allAccounts?.[0]?.code || "", debit: "", credit: "" }]);
  };

  const removeLine = (idx) => {
    if (data.lines.length <= 2) return;
    setData("lines", data.lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx, field, value) => {
    const newLines = [...data.lines];
    newLines[idx][field] = value;
    if (field === "debit" && value) newLines[idx].credit = "0";
    if (field === "credit" && value) newLines[idx].debit = "0";
    setData("lines", newLines);
  };

  const totalDebit = data.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = data.lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isBalanced) return;
    post("/banking/journal", {
      onSuccess: () => {
        setShowModal(false);
        reset();
      },
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Banking & Chart of Accounts - Nefco Books" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cash, Bank & Journal Entries</h1>
            <p className="text-xs text-slate-500">Manage bank balances, liquidity, and manual double-entry ledger journals</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Journal Entry</span>
          </button>
        </div>

        {/* Bank & Cash Accounts Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts?.map((acc) => (
            <div key={acc.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {acc.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mt-2">{acc.name}</h3>
                  <p className="text-xs text-slate-400 capitalize">{acc.sub_type.replace(/_/g, " ").toLowerCase()}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 border border-slate-100">
                  <Landmark className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Current Balance</span>
                <span className="text-lg font-bold font-mono text-slate-900">{formatBDT(acc.balance)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Journal Entries Ledger */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-500" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent General Journal Entries</h2>
            </div>
            <span className="text-xs text-slate-400">Strict Double-Entry Verified</span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Entry #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description / Reference</th>
                <th className="py-3 px-4">Account Lines</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentJournals?.length > 0 ? (
                recentJournals.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/75 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {j.entry_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(j.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      <div className="font-medium">{j.description}</div>
                      {j.reference && <div className="text-[11px] text-slate-400 font-mono">Ref: {j.reference}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {j.lines?.map((line, idx) => (
                          <div key={idx} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <span className="font-mono text-slate-400">{line.account?.code}</span>
                            <span className="font-medium">{line.account?.name}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                      <div className="space-y-1">
                        {j.lines?.map((line, idx) => (
                          <div key={idx} className="text-[11px]">
                            {parseFloat(line.debit) > 0 ? formatBDT(line.debit) : "-"}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                      <div className="space-y-1">
                        {j.lines?.map((line, idx) => (
                          <div key={idx} className="text-[11px]">
                            {parseFloat(line.credit) > 0 ? formatBDT(line.credit) : "-"}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No journal entries recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Journal Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Double-Entry Journal</h3>
                <p className="text-xs text-slate-500">Ensure total debits strictly match total credits</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={data.description}
                    onChange={(e) => setData("description", e.target.value)}
                    placeholder="e.g. Office Rent Payment, Transfer..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {errors.description && <p className="text-red-500 text-[11px] mt-1">{errors.description}</p>}
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Reference (Optional)</label>
                  <input
                    type="text"
                    value={data.reference}
                    onChange={(e) => setData("reference", e.target.value)}
                    placeholder="e.g. CHQ-9921, TrxID..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Journal Lines */}
              <div className="space-y-2 pt-2">
                <label className="block font-semibold text-slate-800">Journal Lines (Debits & Credits)</label>
                {data.lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <select
                        value={line.account_code}
                        onChange={(e) => updateLine(idx, "account_code", e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-slate-50 focus:outline-none"
                      >
                        {allAccounts?.map((a) => (
                          <option key={a.code} value={a.code}>
                            {a.code} - {a.name} ({a.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Debit (৳)"
                        value={line.debit}
                        onChange={(e) => updateLine(idx, "debit", e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs text-right font-mono"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Credit (৳)"
                        value={line.credit}
                        onChange={(e) => updateLine(idx, "credit", e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs text-right font-mono"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="text-red-400 hover:text-red-600 font-bold"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addLine}
                  className="text-xs text-blue-600 hover:underline font-semibold mt-1"
                >
                  + Add Line
                </button>
              </div>

              {/* Balance Verification Bar */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between font-mono">
                <div className="flex gap-4">
                  <span>Debits: <strong className="text-slate-800">{formatBDT(totalDebit)}</strong></span>
                  <span>Credits: <strong className="text-slate-800">{formatBDT(totalCredit)}</strong></span>
                </div>
                <div>
                  {isBalanced ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" /> Balanced
                    </span>
                  ) : (
                    <span className="text-rose-500 font-bold flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" /> Diff: {formatBDT(Math.abs(totalDebit - totalCredit))}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-md font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced || processing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md font-semibold transition"
                >
                  {processing ? "Posting..." : "Post Balanced Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
