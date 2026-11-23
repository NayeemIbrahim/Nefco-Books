import React, { useState } from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";
import { router } from "@inertiajs/react";

export default function GeneralLedger({
  accounts = [],
  allAccountsList = [],
  filters = {},
}) {
  const [selectedAccount, setSelectedAccount] = useState(filters.account_id || "");

  const handleAccountChange = (e) => {
    const accId = e.target.value;
    setSelectedAccount(accId);
    router.get(
      "/reports/general-ledger",
      { ...filters, account_id: accId },
      { preserveState: true, replace: true }
    );
  };

  const accountFilterSlot = (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-semibold text-slate-600">Filter by Account:</span>
      <select
        value={selectedAccount}
        onChange={handleAccountChange}
        className="text-xs py-1 px-2.5 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
      >
        <option value="">All Accounts ({allAccountsList.length})</option>
        {allAccountsList.map((a) => (
          <option key={a.id} value={a.id}>
            {a.code} - {a.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <ReportLayout title="General Ledger" filters={filters} extraFilters={accountFilterSlot}>
      <div className="space-y-8">
        {accounts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 italic">No account ledger entries found for this selection.</div>
        ) : (
          accounts.map((acc) => (
            <div key={acc.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              {/* Account Header */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-sm text-blue-600 mr-2">{acc.code}</span>
                  <span className="font-bold text-sm text-slate-800">{acc.name}</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 ml-2 rounded bg-slate-200 text-slate-700">
                    {acc.type}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-600">
                  Closing Balance: <span className="font-mono font-bold text-slate-900">{formatBDT(acc.closing_balance)}</span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600 min-w-[700px]">
                  <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Entry #</th>
                      <th className="py-2 px-3">Reference</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right">Debit (৳)</th>
                      <th className="py-2 px-3 text-right">Credit (৳)</th>
                      <th className="py-2 px-3 text-right">Running Balance (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {acc.lines.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-3 px-3 text-center text-slate-400 italic">
                          No transactions recorded in this period.
                        </td>
                      </tr>
                    ) : (
                      acc.lines.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50 transition">
                          <td className="py-1.5 px-3 font-mono text-[11px] whitespace-nowrap text-slate-500">{l.date}</td>
                          <td className="py-1.5 px-3 font-mono text-slate-700">{l.entry_number}</td>
                          <td className="py-1.5 px-3 font-mono text-slate-500">{l.reference || "-"}</td>
                          <td className="py-1.5 px-3 text-slate-700">{l.description}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-slate-900">
                            {l.debit > 0 ? formatBDT(l.debit) : "-"}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono text-slate-900">
                            {l.credit > 0 ? formatBDT(l.credit) : "-"}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-900">
                            {formatBDT(l.running_balance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {acc.lines.length > 0 && (
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-800 text-[11px]">
                      <tr>
                        <td colSpan="4" className="py-2 px-3 text-right uppercase tracking-wider">
                          Subtotal
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-blue-700">{formatBDT(acc.total_debit)}</td>
                        <td className="py-2 px-3 text-right font-mono text-purple-700">{formatBDT(acc.total_credit)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatBDT(acc.closing_balance)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </ReportLayout>
  );
}
