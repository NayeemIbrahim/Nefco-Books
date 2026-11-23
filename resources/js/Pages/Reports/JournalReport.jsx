import React from "react";
import ReportLayout from "@/Components/Reports/ReportLayout";
import { formatBDT } from "@/lib/utils";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function JournalReport({
  entries = [],
  total_debits = 0,
  total_credits = 0,
  filters = {},
}) {
  return (
    <ReportLayout title="Journal Report" filters={filters}>
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500 block">Total Journal Entries</span>
            <span className="text-base font-bold text-slate-800">{entries.length}</span>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-[11px] font-medium text-blue-700 block">Total Debits</span>
            <span className="text-base font-bold font-mono text-blue-900">{formatBDT(total_debits)}</span>
          </div>
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <span className="text-[11px] font-medium text-purple-700 block">Total Credits</span>
            <span className="text-base font-bold font-mono text-purple-900">{formatBDT(total_credits)}</span>
          </div>
        </div>

        {/* Entries List */}
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic">No journal entries recorded for this period.</div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {/* Entry Header */}
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600">{entry.entry_number}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-mono">{entry.date}</span>
                    {entry.reference && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 font-mono">Ref: {entry.reference}</span>
                      </>
                    )}
                    {entry.contact_name && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="font-medium text-slate-700">Contact: {entry.contact_name}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {entry.source_document_type}
                    </span>
                    {entry.is_balanced ? (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        <CheckCircle2 className="h-3 w-3" /> Balanced
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-700 font-bold flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                        <AlertCircle className="h-3 w-3" /> Unbalanced
                      </span>
                    )}
                  </div>
                </div>

                {entry.description && (
                  <div className="px-4 py-1.5 bg-slate-50/50 text-[11px] text-slate-500 border-b border-slate-100">
                    {entry.description}
                  </div>
                )}

                {/* Entry Lines */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600">
                    <thead className="bg-slate-100/70 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Account Code & Name</th>
                        <th className="py-2 px-3">Line Description</th>
                        <th className="py-2 px-3 text-right">Debit (৳)</th>
                        <th className="py-2 px-3 text-right">Credit (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entry.lines.map((l, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-1.5 px-3">
                            <span className="font-mono font-bold text-blue-600 mr-2">{l.account_code}</span>
                            <span className="font-medium text-slate-800">{l.account_name}</span>
                          </td>
                          <td className="py-1.5 px-3 text-slate-500 text-[11px]">{l.description || "-"}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-slate-900">
                            {l.debit > 0 ? formatBDT(l.debit) : "-"}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono text-slate-900">
                            {l.credit > 0 ? formatBDT(l.credit) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-semibold text-[11px] text-slate-800 border-t border-slate-200">
                      <tr>
                        <td colSpan="2" className="py-1.5 px-3 text-right uppercase tracking-wider text-[10px]">
                          Total
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-blue-700">
                          {formatBDT(entry.total_debit)}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-purple-700">
                          {formatBDT(entry.total_credit)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ReportLayout>
  );
}
