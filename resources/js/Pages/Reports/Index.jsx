import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { BarChart3, TrendingUp, Scale, FileSpreadsheet, ArrowRight } from "lucide-react";
import { Head, Link } from "@inertiajs/react";

export default function ReportsIndex() {
  const reports = [
    {
      title: "Profit and Loss Statement",
      description: "Summarizes operating revenues, Cost of Goods Sold (COGS), and business expenses to compute Net Profit/Loss.",
      href: "/reports/profit-and-loss",
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      title: "Balance Sheet",
      description: "Financial snapshot detailing company Assets, Liabilities, and Equity based on the accounting equation: Assets = Liabilities + Equity.",
      href: "/reports/balance-sheet",
      icon: Scale,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      title: "Trial Balance",
      description: "Displays every Chart of Accounts code with cumulative debits and credits to ensure full ledger equilibrium.",
      href: "/reports/trial-balance",
      icon: FileSpreadsheet,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Financial Reports - Nefco Books" />

      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial Reports & Statements</h1>
          <p className="text-xs text-slate-500">Standard accounting reports generated in real time from double-entry journal postings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reports.map((r, idx) => {
            const Icon = r.icon;
            return (
              <div key={idx} className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${r.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">{r.title}</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    href={r.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                  >
                    <span>View Full Report</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
