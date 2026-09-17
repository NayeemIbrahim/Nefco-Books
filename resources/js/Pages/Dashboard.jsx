import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, Wallet, Building2 } from "lucide-react";
import { Head, Link } from "@inertiajs/react";

export default function Dashboard({ metrics, recentInvoices }) {
  const receivables = metrics?.receivables ?? 145000;
  const payables = metrics?.payables ?? 38500;
  const bankBalance = metrics?.bankBalance ?? 520000;
  const netCashFlow = metrics?.netCashFlow ?? 106500;

  return (
    <AuthenticatedLayout>
      <Head title="Business Overview - Nefco Books" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Business Overview</h1>
            <p className="text-xs text-slate-500">Real-time financial summary in Bangladeshi Taka (BDT)</p>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-xs">
            Financial Year: <span className="text-slate-800 font-bold">2026-2027</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Receivables</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatBDT(receivables)}</div>
              <p className="text-[11px] text-slate-400 mt-1">Pending from 12 customers</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Payables</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-md">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatBDT(payables)}</div>
              <p className="text-[11px] text-slate-400 mt-1">Due to 4 vendors</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cash & Bank</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatBDT(bankBalance)}</div>
              <p className="text-[11px] text-slate-400 mt-1">Standard Chartered & bKash</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Cash Flow</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatBDT(netCashFlow)}</div>
              <p className="text-[11px] text-emerald-600 mt-1">Healthy liquidity</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Quick Accounting Actions</h2>
            <p className="text-xs text-slate-500">Record a new sales invoice, customer receipt, or vendor bill</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/sales/invoices"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition shadow-xs"
            >
              + Create Invoice
            </Link>
            <Link
              href="/contacts"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition border border-slate-200"
            >
              + Add Contact
            </Link>
            <Link
              href="/purchases/bills"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition border border-slate-200"
            >
              + New Bill
            </Link>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
