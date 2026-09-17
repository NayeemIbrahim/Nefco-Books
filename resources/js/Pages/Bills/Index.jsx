import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { FileText, Plus, Search, Calendar, User, CheckCircle2, Clock } from "lucide-react";
import { Head } from "@inertiajs/react";

export default function BillsIndex({ bills, vendors, items }) {
  return (
    <AuthenticatedLayout>
      <Head title="Bills & Purchases - Nefco Books" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vendor Bills & Purchases</h1>
            <p className="text-xs text-slate-500">Record supplier bills, accounts payable, and track supplier payables</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-xs transition">
            <Plus className="h-4 w-4" />
            <span>New Vendor Bill</span>
          </button>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Bill #</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Bill Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills?.data?.length > 0 ? (
                bills.data.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/75 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {bill.bill_number}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-medium">
                      {bill.contact?.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(bill.bill_date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(bill.due_date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatBDT(bill.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 font-medium">
                      {formatBDT(bill.balance_due)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        bill.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700"
                          : bill.status === "PARTIALLY_PAID"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No vendor bills recorded yet. Click "New Vendor Bill" to enter purchase expenses.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
