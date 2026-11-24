import React, { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
  LayoutDashboard,
  Users,
  Package,
  CalendarCheck,
  FileText,
  CreditCard,
  Landmark,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  BookOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar({ isOpen, onClose }) {
  const { url, props } = usePage();
  const company = props?.company;

  const isSalesActive =
    url.startsWith("/sales") ||
    url.startsWith("/invoices") ||
    url.startsWith("/bookings") ||
    url.startsWith("/payments-received");

  const isPurchasesActive =
    url.startsWith("/purchases") ||
    url.startsWith("/bills") ||
    url.startsWith("/expenses") ||
    url.startsWith("/payments-made");

  const [salesOpen, setSalesOpen] = useState(true);
  const [purchasesOpen, setPurchasesOpen] = useState(true);
  const isReportsActive = url.startsWith("/reports") || url.startsWith("/banking");
  const [reportsOpen, setReportsOpen] = useState(true);

  const renderNavContent = () => (
    <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
      <div className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        Main Modules
      </div>

      {/* 1. Dashboard */}
      <Link
        href="/"
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all duration-150",
          url === "/"
            ? "bg-amber-600 text-white shadow-sm font-semibold"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        )}
      >
        <LayoutDashboard className={cn("h-4 w-4 shrink-0", url === "/" ? "text-white" : "text-slate-400")} />
        <span>Dashboard</span>
      </Link>

      {/* 2. Items & Inventory */}
      <Link
        href="/items"
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all duration-150",
          url.startsWith("/items")
            ? "bg-amber-600 text-white shadow-sm font-semibold"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        )}
      >
        <Package className={cn("h-4 w-4 shrink-0", url.startsWith("/items") ? "text-white" : "text-slate-400")} />
        <span>Items & Inventory</span>
      </Link>

      {/* 3. Contacts CRM */}
      <Link
        href="/contacts"
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all duration-150",
          url.startsWith("/contacts")
            ? "bg-amber-600 text-white shadow-sm font-semibold"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        )}
      >
        <Users className={cn("h-4 w-4 shrink-0", url.startsWith("/contacts") ? "text-white" : "text-slate-400")} />
        <span>Contacts (CRM)</span>
      </Link>

      {/* 4. Sales Module (Group with Suboptions) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setSalesOpen(!salesOpen)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all duration-150",
            isSalesActive
              ? "text-amber-400 bg-slate-800/80"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          )}
        >
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-4 w-4 text-amber-500" />
            <span>Sales</span>
          </div>
          {salesOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {salesOpen && (
          <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5">
            {/* Invoices */}
            <Link
              href="/sales/invoices"
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition",
                url.startsWith("/sales/invoices") || url.startsWith("/invoices")
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span>Invoices</span>
            </Link>

            {/* Bookings & Orders */}
            <Link
              href="/sales/bookings"
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition",
                url.startsWith("/sales/bookings") || url.startsWith("/bookings")
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <CalendarCheck className="h-3.5 w-3.5 shrink-0" />
              <span>Bookings & Orders</span>
            </Link>

            {/* Payments Received */}
            <Link
              href="/sales/payments-received"
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition",
                url.startsWith("/sales/payments-received") || url.startsWith("/payments-received")
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>Payments Received</span>
            </Link>
          </div>
        )}
      </div>

      {/* 5. Purchases Module (Group with Suboptions) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setPurchasesOpen(!purchasesOpen)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all duration-150",
            isPurchasesActive
              ? "text-amber-400 bg-slate-800/80"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          )}
        >
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="h-4 w-4 text-amber-500" />
            <span>Purchases</span>
          </div>
          {purchasesOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {purchasesOpen && (
          <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5">
            {/* Bills */}
            <Link
              href="/purchases/bills"
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition",
                url.startsWith("/purchases/bills") || url.startsWith("/bills")
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <CreditCard className="h-3.5 w-3.5 shrink-0" />
              <span>Bills</span>
            </Link>

            {/* Operating Expenses */}
            <Link
              href="/purchases/expenses"
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition",
                url.startsWith("/purchases/expenses") || url.startsWith("/expenses")
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <Receipt className="h-3.5 w-3.5 shrink-0 text-amber-300" />
              <span>Expenses</span>
            </Link>

            {/* Payments Made */}
            <Link
              href="/purchases/payments-made"
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition",
                url.startsWith("/purchases/payments-made") || url.startsWith("/payments-made")
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-red-400" />
              <span>Payments Made</span>
            </Link>
          </div>
        )}
      </div>

      {/* 6. Reports Module (Group with Suboptions) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setReportsOpen(!reportsOpen)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all duration-150",
            isReportsActive
              ? "text-amber-400 bg-slate-800/80"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          )}
        >
          <div className="flex items-center gap-2.5">
            <BarChart3 className="h-4 w-4 text-amber-500" />
            <span>Reports</span>
          </div>
          {reportsOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {reportsOpen && (
          <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5">
            {/* Reports Center */}
            <Link
              href="/reports"
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition",
                url === "/reports"
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <BarChart3 className="h-3.5 w-3.5 shrink-0" />
              <span>Reports Center</span>
            </Link>

            {/* Customer Statement */}
            <Link
              href="/reports/customer-statement"
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition",
                url.startsWith("/reports/customer-statement")
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span>Customer Statement</span>
            </Link>

            {/* Vendor Statement */}
            <Link
              href="/reports/vendor-statement"
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition",
                url.startsWith("/reports/vendor-statement")
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span>Vendor Statement</span>
            </Link>

            {/* Banking & General Ledger */}
            <Link
              href="/banking"
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition",
                url.startsWith("/banking")
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <Landmark className="h-3.5 w-3.5 shrink-0" />
              <span>Banking & Ledger</span>
            </Link>
          </div>
        )}
      </div>

      {/* 8. Settings */}
      <Link
        href="/settings"
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all duration-150",
          url.startsWith("/settings")
            ? "bg-amber-600 text-white shadow-sm font-semibold"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        )}
      >
        <Settings className={cn("h-4 w-4 shrink-0", url.startsWith("/settings") ? "text-white" : "text-slate-400")} />
        <span>Settings & Setup</span>
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 min-h-screen shrink-0">
        <div className="flex items-center gap-3 h-16 px-6 bg-slate-950 border-b border-slate-800">
          {company?.company_logo ? (
            <img
              src={company.company_logo}
              alt={company.company_name || "Company Logo"}
              className="h-9 max-w-[130px] object-contain rounded"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center font-bold text-white shadow-md shrink-0">
              {(company?.company_name || "NB").slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm tracking-wide text-white truncate">{company?.company_name || "Nefco Books"}</h1>
            <p className="text-[10px] text-slate-400 font-medium truncate">{company?.default_uom ? "Cloud Accounting" : "Accounting ERP"}</p>
          </div>
        </div>
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Slide-in Drawer */}
          <aside className="relative flex flex-col w-72 max-w-[80vw] bg-slate-900 text-slate-200 shadow-2xl h-full z-50">
            <div className="flex items-center justify-between h-16 px-5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-3 overflow-hidden">
                {company?.company_logo ? (
                  <img
                    src={company.company_logo}
                    alt={company.company_name || "Company Logo"}
                    className="h-9 max-w-[120px] object-contain rounded"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center font-bold text-white shadow-md shrink-0">
                    {(company?.company_name || "NB").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <h1 className="font-bold text-sm tracking-wide text-white truncate">{company?.company_name || "Nefco Books"}</h1>
                  <p className="text-[10px] text-slate-400 font-medium truncate">Cloud Accounting</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
}
