import React, { useState, useMemo, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import {
  Search,
  Star,
  ArrowRight,
  TrendingUp,
  Scale,
  FileSpreadsheet,
  DollarSign,
  Users,
  Package,
  Receipt,
  Clock,
  FileText,
  CreditCard,
  ShoppingBag,
  BookOpen,
  PieChart,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Landmark,
} from "lucide-react";

export default function ReportsIndex() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("nefco_favorite_reports");
      return saved ? JSON.parse(saved) : ["profit-and-loss", "balance-sheet", "trial-balance", "customer-balance-summary"];
    } catch (e) {
      return ["profit-and-loss", "balance-sheet", "trial-balance"];
    }
  });

  const toggleFavorite = (reportId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId];
      try {
        localStorage.setItem("nefco_favorite_reports", JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const reports = [
    // 1. Business Overview
    {
      id: "profit-and-loss",
      title: "Profit and Loss Statement",
      description: "Summarizes operating revenues, Cost of Goods Sold (COGS), and business expenses to compute Net Profit/Loss.",
      category: "Business Overview",
      href: "/reports/profit-and-loss",
      icon: TrendingUp,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: "balance-sheet",
      title: "Balance Sheet",
      description: "Financial snapshot detailing company Assets, Liabilities, and Equity based on the accounting equation: Assets = Liabilities + Equity.",
      category: "Business Overview",
      href: "/reports/balance-sheet",
      icon: Scale,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      id: "cash-flow",
      title: "Cash Flow Statement",
      description: "Tracks cash movements from operating, investing, and financing activities across all liquid cash and bank accounts.",
      category: "Business Overview",
      href: "/reports/cash-flow",
      icon: DollarSign,
      badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    },

    // 2. Sales
    {
      id: "sales-summary",
      title: "Sales Summary",
      description: "Aggregates total invoiced sales, discounts, taxes, shipping, adjustments, and net revenue.",
      category: "Sales",
      href: "/reports/sales-summary",
      icon: TrendingUp,
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      id: "sales-by-customer",
      title: "Sales by Customer",
      description: "Breakdown of invoice count, total sales volume, and outstanding balances per customer.",
      category: "Sales",
      href: "/reports/sales-by-customer",
      icon: Users,
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      id: "sales-by-item",
      title: "Sales by Item",
      description: "Breakdown of quantities sold, average sales rate, and total revenue per product or service.",
      category: "Sales",
      href: "/reports/sales-by-item",
      icon: Package,
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },

    // 3. Receivables
    {
      id: "customer-balance-summary",
      title: "Customer Balance Summary",
      description: "Comprehensive listing of all customers, opening balances, total invoiced, payments received, and closing balances.",
      category: "Receivables",
      href: "/reports/customer-balance-summary",
      icon: Users,
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      id: "customer-statement",
      title: "Customer Statement / Party Ledger",
      description: "Detailed chronological transaction ledger statement for a selected customer with opening balance and running balance.",
      category: "Receivables",
      href: "/reports/customer-statement",
      icon: BookOpen,
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      id: "order-details",
      title: "Order Details",
      description: "Overview of customer bookings, deals, order dates, conversion to invoice status, and amounts.",
      category: "Receivables",
      href: "/reports/order-details",
      icon: Receipt,
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      id: "ar-aging-summary",
      title: "AR Aging Summary",
      description: "Accounts Receivable aging buckets: Current, 1-30 days, 31-60 days, 61-90 days, and 90+ days overdue.",
      category: "Receivables",
      href: "/reports/ar-aging-summary",
      icon: Clock,
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      id: "invoice-details",
      title: "Invoice Details",
      description: "Line-by-line itemized invoice report showing issue date, due date, customer, status, total, paid, and balance due.",
      category: "Receivables",
      href: "/reports/invoice-details",
      icon: FileText,
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      id: "receivable-summary",
      title: "Receivable Summary",
      description: "Executive high-level summary of total receivables, collection efficiency, and overdue debt.",
      category: "Receivables",
      href: "/reports/receivable-summary",
      icon: Layers,
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    },

    // 4. Payments Received
    {
      id: "payments-received",
      title: "Payments Received",
      description: "Chronological ledger of customer receipts with payment date, payment #, customer, payment mode, and amount.",
      category: "Payments Received",
      href: "/reports/payments-received",
      icon: ArrowDownLeft,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },

    // 5. Payables
    {
      id: "vendor-balance-summary",
      title: "Vendor Balance Summary",
      description: "Comprehensive listing of all vendors, opening balances, total billed, payments made, and closing payable balances.",
      category: "Payables",
      href: "/reports/vendor-balance-summary",
      icon: Users,
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "vendor-statement",
      title: "Vendor Statement / Party Ledger",
      description: "Detailed chronological transaction ledger statement for a selected vendor with opening balance and running payable balance.",
      category: "Payables",
      href: "/reports/vendor-statement",
      icon: BookOpen,
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "ap-aging-summary",
      title: "AP Aging Summary",
      description: "Accounts Payable aging buckets: Current, 1-30 days, 31-60 days, 61-90 days, and 90+ days overdue bills.",
      category: "Payables",
      href: "/reports/ap-aging-summary",
      icon: Clock,
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "bill-details",
      title: "Bill Details",
      description: "Detailed vendor bills listing showing bill date, vendor, status, total amount, paid amount, and balance due.",
      category: "Payables",
      href: "/reports/bill-details",
      icon: FileText,
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "payments-made",
      title: "Payments Made",
      description: "Chronological ledger of vendor payments with payment date, payment #, vendor, payment mode, and amount.",
      category: "Payables",
      href: "/reports/payments-made",
      icon: ArrowUpRight,
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "payable-summary",
      title: "Payable Summary",
      description: "Executive high-level summary of outstanding vendor liabilities and upcoming payment obligations.",
      category: "Payables",
      href: "/reports/payable-summary",
      icon: Layers,
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },

    // 6. Purchases and Expenses
    {
      id: "purchases-by-vendor",
      title: "Purchases by Vendor",
      description: "Total procurement volume and billed amounts aggregated by vendor.",
      category: "Purchases and Expenses",
      href: "/reports/purchases-by-vendor",
      icon: ShoppingBag,
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      id: "purchases-by-item",
      title: "Purchases by Item",
      description: "Total quantity, unit costs, and total purchased amounts per product or raw material.",
      category: "Purchases and Expenses",
      href: "/reports/purchases-by-item",
      icon: Package,
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      id: "expense-details",
      title: "Expense Details",
      description: "Itemized operational expenses with expense date, account, paid through account, vendor, and amount.",
      category: "Purchases and Expenses",
      href: "/reports/expense-details",
      icon: Receipt,
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      id: "expenses-by-category",
      title: "Expenses by Category",
      description: "Operating expenses grouped by chart of account categories with total spend and percentage distribution.",
      category: "Purchases and Expenses",
      href: "/reports/expenses-by-category",
      icon: PieChart,
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    },

    // 7. Accountant
    {
      id: "trial-balance",
      title: "Trial Balance",
      description: "Displays every Chart of Accounts code with cumulative debits and credits to ensure full ledger equilibrium.",
      category: "Accountant",
      href: "/reports/trial-balance",
      icon: FileSpreadsheet,
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: "general-ledger",
      title: "General Ledger",
      description: "Comprehensive transaction history for every account code with chronological debits, credits, and running balances.",
      category: "Accountant",
      href: "/reports/general-ledger",
      icon: BookOpen,
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: "journal-report",
      title: "Journal Report",
      description: "Chronological audit trail of all manual and automated double-entry journal entries with verification of balance.",
      category: "Accountant",
      href: "/reports/journal-report",
      icon: FileText,
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: "banking-ledger",
      title: "Banking & Cash Ledgers",
      description: "Manage bank accounts, record manual double-entry journal vouchers, and audit cash account ledgers.",
      category: "Accountant",
      href: "/banking",
      icon: Landmark,
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ];

  const categories = [
    "Business Overview",
    "Sales",
    "Receivables",
    "Payments Received",
    "Payables",
    "Purchases and Expenses",
    "Accountant",
  ];

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Category filter
      if (activeCategory === "FAVORITES" && !favorites.includes(r.id)) {
        return false;
      }
      if (activeCategory !== "ALL" && activeCategory !== "FAVORITES" && r.category !== activeCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [reports, activeCategory, favorites, searchQuery]);

  // Group by category if viewing ALL or FAVORITES
  const groupedReports = useMemo(() => {
    const groups = {};
    filteredReports.forEach((r) => {
      if (!groups[r.category]) {
        groups[r.category] = [];
      }
      groups[r.category].push(r);
    });
    return groups;
  }, [filteredReports]);

  return (
    <AuthenticatedLayout>
      <Head title="Reports Center - Nefco Books" />

      <div className="space-y-5">
        {/* Top Header & Search Bar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Reports Center</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {reports.length} Reports
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time financial statements, operational summaries, and accountant ledgers
            </p>
          </div>

          {/* Live Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports by name, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Layout: Left Category Navigation & Right Reports Table */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Inner Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs p-3 space-y-1 sticky top-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
              Report Views
            </div>

            <button
              type="button"
              onClick={() => setActiveCategory("ALL")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeCategory === "ALL"
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span>All Reports</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeCategory === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {reports.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("FAVORITES")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeCategory === "FAVORITES"
                  ? "bg-amber-600 text-white font-semibold shadow-xs"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                <span>Favorites</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeCategory === "FAVORITES" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                }`}
              >
                {favorites.length}
              </span>
            </button>

            <div className="pt-2 pb-1">
              <div className="h-px bg-slate-100 mx-2" />
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
              Categories
            </div>

            {categories.map((cat) => {
              const count = reports.filter((r) => r.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                    activeCategory === cat
                      ? "bg-blue-600 text-white font-semibold shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="truncate pr-2">{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeCategory === cat ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main Area: Reports Table */}
          <div className="lg:col-span-3 space-y-4">
            {filteredReports.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No reports found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `No reports match your search query "${searchQuery}". Try searching for another keyword or clear the search.`
                    : "No favorite reports marked yet. Click the star icon next to any report to pin it here."}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              Object.entries(groupedReports).map(([catName, catReports]) => (
                <div key={catName} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {catName}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {catReports.length} {catReports.length === 1 ? "report" : "reports"}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {catReports.map((report) => {
                      const Icon = report.icon;
                      const isFav = favorites.includes(report.id);
                      return (
                        <div
                          key={report.id}
                          className="p-3.5 sm:px-4 hover:bg-slate-50/70 transition flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Favorite Star Toggle */}
                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(report.id, e)}
                              className="p-1 rounded-md text-slate-300 hover:text-amber-500 transition shrink-0"
                              title={isFav ? "Remove from Favorites" : "Mark as Favorite"}
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  isFav ? "fill-amber-400 text-amber-500" : "text-slate-300 hover:text-slate-400"
                                }`}
                              />
                            </button>

                            {/* Icon */}
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                              <Icon className="h-4 w-4" />
                            </div>

                            {/* Details */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={report.href}
                                  className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition truncate"
                                >
                                  {report.title}
                                </Link>
                                <span
                                  className={`hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${report.badgeColor}`}
                                >
                                  {report.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate max-w-lg mt-0.5">
                                {report.description}
                              </p>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="shrink-0 flex items-center">
                            <Link
                              href={report.href}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 group-hover:text-blue-600 px-2.5 py-1 rounded-md border border-slate-200 group-hover:border-blue-200 bg-white group-hover:bg-blue-50 transition"
                            >
                              <span>View</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
