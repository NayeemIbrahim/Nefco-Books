import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, Building2, TrendingUp, Plus } from "lucide-react";
import { Head, Link } from "@inertiajs/react";

export default function Dashboard({ metrics, recentInvoices }) {
  const receivablesBDT = metrics?.receivables ?? 145000.0;
  const payablesBDT = metrics?.payables ?? 38500.0;
  const bankBalanceBDT = metrics?.bankBalance ?? 520000.0;
  const netCashFlowBDT = metrics?.netCashFlow ?? 106500.0;

  return (
    <AuthenticatedLayout>
      <Head title="Business Overview - Nefco Books" />

      <div className="space-y-6">
        {/* Top Header Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Business Overview</h1>
            <p className="text-xs text-slate-500">Real-time financial summary in Bangladeshi Taka (BDT)</p>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-xs">
            Financial Year: <span className="text-slate-800 font-bold">2026-2027</span>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Receivables */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Receivables</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatBDT(receivablesBDT)}</div>
              <div className="text-[11px] text-blue-600 font-medium mt-1">Due from Customers</div>
            </div>
          </div>

          {/* Total Payables */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Payables</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-md">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatBDT(payablesBDT)}</div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">Due to Vendors</div>
            </div>
          </div>

          {/* Bank & Cash Balance */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Bank & Cash Balance</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatBDT(bankBalanceBDT)}</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">Across 3 Accounts</div>
            </div>
          </div>

          {/* Net Cash Flow */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Cash Flow</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-md">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatBDT(netCashFlowBDT)}</div>
              <div className="text-[11px] text-purple-600 font-medium mt-1">This Month</div>
            </div>
          </div>
        </div>

        {/* Account Balances Table & Quick Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800">Cash & Bank Accounts (BDT)</h2>
              <span className="text-xs text-slate-400 font-medium">Chart of Accounts 1000 Series</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Account Code</th>
                    <th className="py-2.5 px-3">Account Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-semibold text-blue-600">1000</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">Petty Cash</td>
                    <td className="py-2.5 px-3 text-slate-500">Cash and Bank</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatBDT(20000)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-semibold text-blue-600">1010</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">Main Bank Account (Standard Chartered BDT)</td>
                    <td className="py-2.5 px-3 text-slate-500">Cash and Bank</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatBDT(450000)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-semibold text-blue-600">1020</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">bKash / Nagad Merchant Account</td>
                    <td className="py-2.5 px-3 text-slate-500">Cash and Bank</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatBDT(50000)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick System Status & WhatsApp Indicator */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800">Integration Status</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800">
                <div className="font-semibold">Currency Engine</div>
                <div className="bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                  BDT (৳) Locked
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                <div className="font-semibold">Double-Entry Ledger</div>
                <div className="bg-blue-200 text-blue-900 font-bold px-2 py-0.5 rounded text-[10px]">
                  Active
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
                <div className="font-semibold">WhatsApp Cloud API</div>
                <div className="bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                  Configured
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Quick Accounting Actions</h2>
            <p className="text-xs text-slate-500">Record a new sales invoice, customer contact, or vendor bill</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/sales/invoices"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition shadow-xs flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Invoice</span>
            </Link>
            <Link
              href="/contacts"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition border border-slate-200"
            >
              + Add Contact
            </Link>
            <Link
              href="/purchases/bills"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition border border-slate-200"
            >
              + New Bill
            </Link>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
