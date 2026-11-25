import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT, formatDate } from "@/lib/utils";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CalendarCheck,
  Plus,
  FileText,
  Receipt,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Send,
} from "lucide-react";
import { Head, Link, usePage } from "@inertiajs/react";

export default function Dashboard({ receivables, payables, recentBookings }) {
  const { company } = usePage().props;
  const recTotal = receivables?.total ?? 0;
  const payTotal = payables?.total ?? 0;

  const dueInvoices = receivables?.due_invoices || [];
  const dueBills = payables?.due_bills || [];
  const bookingList = recentBookings || [];

  return (
    <AuthenticatedLayout>
      <Head title={`Business Overview - ${company?.company_name || "Nefco Books"}`} />

      <div className="space-y-6">
        {/* Top Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Business Overview</h1>
            <p className="text-xs text-slate-500">Real-time receivables, payables, and customer deals summary</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/sales/payments-received"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              <span>Payments Received</span>
            </Link>
            <Link
              href="/purchases/payments-made"
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Payments Made</span>
            </Link>
          </div>
        </div>

        {/* Quick Accounting Actions Top Section */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span>Quick Accounting Actions</span>
            </h3>
            <p className="text-xs text-slate-500">Fast shortcuts for daily transactions</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/sales/bookings"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Booking / Deal</span>
            </Link>
            <Link
              href="/sales/invoices"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Invoice</span>
            </Link>
            <Link
              href="/purchases/bills"
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Bill</span>
            </Link>
            <Link
              href="/sales/payments-received"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold border border-slate-200 transition"
            >
              Receive Payment
            </Link>
            <Link
              href="/purchases/payments-made"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold border border-slate-200 transition"
            >
              Make Payment
            </Link>
            <Link
              href="/purchases/expenses"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold border border-slate-200 transition"
            >
              Record Expense
            </Link>
          </div>
        </div>

        {/* Two Main Cards: Total Receivables & Total Payables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Total Receivables */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Total Receivables</h2>
                    <p className="text-xs text-slate-400">Unpaid & Due Invoices from Customers</p>
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 mt-3 font-mono">
                  {formatBDT(recTotal)}
                </div>
              </div>
              <Link
                href="/sales/invoices?status=UNPAID"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition"
              >
                View Invoices →
              </Link>
            </div>

            {/* Breakdown Sub-metrics */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Unpaid</span>
                <div className="font-bold text-slate-800 mt-0.5">{receivables?.unpaid_count || 0} Invoices</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{formatBDT(receivables?.unpaid_amount || 0)}</div>
              </div>
              <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Partially Paid</span>
                <div className="font-bold text-slate-800 mt-0.5">{receivables?.partially_paid_count || 0} Invoices</div>
                <div className="text-[11px] text-amber-800 font-mono mt-0.5">{formatBDT(receivables?.partially_paid_amount || 0)}</div>
              </div>
              <div className="bg-red-50/60 border border-red-200/80 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-red-700 uppercase">Overdue</span>
                <div className="font-bold text-red-900 mt-0.5">{receivables?.overdue_count || 0} Invoices</div>
                <div className="text-[11px] text-red-700 font-mono mt-0.5">{formatBDT(receivables?.overdue_amount || 0)}</div>
              </div>
            </div>

            {/* Due Invoices List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Top Outstanding Invoices</span>
                <Link href="/sales/payments-received" className="text-blue-600 hover:underline font-semibold text-[11px]">
                  Receive Payment →
                </Link>
              </div>

              {dueInvoices.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
                  🎉 No outstanding customer invoices due!
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full min-w-[480px] text-xs text-left text-slate-600">
                    <thead className="bg-slate-50 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Invoice #</th>
                        <th className="py-2 px-3">Customer</th>
                        <th className="py-2 px-3">Due Date</th>
                        <th className="py-2 px-3 text-right">Balance Due</th>
                        <th className="py-2 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dueInvoices.map((inv) => {
                        const bal = Math.max(0, (parseFloat(inv.total_amount) || 0) - (parseFloat(inv.paid_amount) || 0));
                        return (
                          <tr key={inv.id} className="hover:bg-blue-50/30">
                            <td className="py-2 px-3 font-mono font-bold text-blue-600">{inv.invoice_number}</td>
                            <td className="py-2 px-3 font-medium text-slate-900 truncate max-w-[120px]">{inv.contact?.name || "Customer"}</td>
                            <td className="py-2 px-3 text-slate-500">{formatDate(inv.due_date)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatBDT(bal)}</td>
                            <td className="py-2 px-3 text-center">
                              <Link
                                href="/sales/payments-received"
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold transition"
                              >
                                Pay
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Total Payables */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <ArrowDownLeft className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Total Payables</h2>
                    <p className="text-xs text-slate-400">Unpaid & Due Bills to Vendors</p>
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 mt-3 font-mono">
                  {formatBDT(payTotal)}
                </div>
              </div>
              <Link
                href="/purchases/bills?status=UNPAID"
                className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-md transition"
              >
                View Bills →
              </Link>
            </div>

            {/* Breakdown Sub-metrics */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Unpaid</span>
                <div className="font-bold text-slate-800 mt-0.5">{payables?.unpaid_count || 0} Bills</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{formatBDT(payables?.unpaid_amount || 0)}</div>
              </div>
              <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Partially Paid</span>
                <div className="font-bold text-slate-800 mt-0.5">{payables?.partially_paid_count || 0} Bills</div>
                <div className="text-[11px] text-amber-800 font-mono mt-0.5">{formatBDT(payables?.partially_paid_amount || 0)}</div>
              </div>
              <div className="bg-red-50/60 border border-red-200/80 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-red-700 uppercase">Overdue</span>
                <div className="font-bold text-red-900 mt-0.5">{payables?.overdue_count || 0} Bills</div>
                <div className="text-[11px] text-red-700 font-mono mt-0.5">{formatBDT(payables?.overdue_amount || 0)}</div>
              </div>
            </div>

            {/* Due Bills List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Top Outstanding Vendor Bills</span>
                <Link href="/purchases/payments-made" className="text-amber-700 hover:underline font-semibold text-[11px]">
                  Pay Bill →
                </Link>
              </div>

              {dueBills.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
                  🎉 No outstanding vendor bills due!
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full min-w-[480px] text-xs text-left text-slate-600">
                    <thead className="bg-slate-50 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Bill #</th>
                        <th className="py-2 px-3">Vendor</th>
                        <th className="py-2 px-3">Due Date</th>
                        <th className="py-2 px-3 text-right">Balance Due</th>
                        <th className="py-2 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dueBills.map((b) => {
                        const bal = Math.max(0, (parseFloat(b.total_amount) || 0) - (parseFloat(b.paid_amount) || 0));
                        return (
                          <tr key={b.id} className="hover:bg-amber-50/30">
                            <td className="py-2 px-3 font-mono font-bold text-amber-700">{b.bill_number}</td>
                            <td className="py-2 px-3 font-medium text-slate-900 truncate max-w-[120px]">{b.contact?.name || "Vendor"}</td>
                            <td className="py-2 px-3 text-slate-500">{formatDate(b.due_date)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatBDT(bal)}</td>
                            <td className="py-2 px-3 text-center">
                              <Link
                                href="/purchases/payments-made"
                                className="px-2 py-0.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-[11px] font-semibold transition"
                              >
                                Pay
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Quotes & Deals Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-blue-600" />
                <span>Customer Quotes & Deals (Bookings)</span>
              </h2>
              <p className="text-xs text-slate-400">Quotes and deals ready to be accepted and converted to invoices</p>
            </div>
            <Link
              href="/sales/bookings"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All Quotes & Deals →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Quote #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Amount (BDT)</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookingList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No quotes or deals. <Link href="/sales/bookings" className="text-blue-600 font-bold underline">Create Quote</Link>
                    </td>
                  </tr>
                ) : (
                  bookingList.map((bkg) => (
                    <tr key={bkg.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{bkg.booking_number}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{bkg.contact?.name || "Customer"}</td>
                      <td className="py-2.5 px-3 text-slate-500">{formatDate(bkg.booking_date)}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            bkg.invoice_number || bkg.status === "INVOICED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {bkg.invoice_number ? `INVOICED: ${bkg.invoice_number}` : "OPEN QUOTE"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatBDT(bkg.total_amount)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <Link
                          href="/sales/bookings"
                          className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
