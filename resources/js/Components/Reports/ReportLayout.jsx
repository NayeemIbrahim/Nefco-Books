import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, Printer, Calendar, RefreshCw } from "lucide-react";

export default function ReportLayout({
  title,
  subtitle,
  children,
  filters = {},
  onFilterChange,
  extraFilters,
  hideDateFilter = false,
}) {
  const safeFilters = (filters && typeof filters === "object" && !Array.isArray(filters)) ? filters : {};
  const [selectedPreset, setSelectedPreset] = React.useState(safeFilters.preset || "THIS_MONTH");
  const [startDate, setStartDate] = React.useState(safeFilters.start_date || "");
  const [endDate, setEndDate] = React.useState(safeFilters.end_date || "");
  const [sortOrder, setSortOrder] = React.useState(
    typeof safeFilters.sort === "string" ? safeFilters.sort : "DESC"
  );

  // Update dates when preset changes
  const applyPreset = (preset) => {
    setSelectedPreset(preset);
    const now = new Date();
    let start = "";
    let end = "";

    const formatYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "TODAY") {
      start = formatYMD(now);
      end = formatYMD(now);
    } else if (preset === "THIS_WEEK") {
      const first = now.getDate() - now.getDay();
      const firstDay = new Date(now.setDate(first));
      const lastDay = new Date(now.setDate(first + 6));
      start = formatYMD(firstDay);
      end = formatYMD(lastDay);
    } else if (preset === "THIS_MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      start = formatYMD(firstDay);
      end = formatYMD(lastDay);
    } else if (preset === "THIS_QUARTER") {
      const quarter = Math.floor(now.getMonth() / 3);
      const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
      const lastDay = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      start = formatYMD(firstDay);
      end = formatYMD(lastDay);
    } else if (preset === "THIS_YEAR") {
      start = `${now.getFullYear()}-01-01`;
      end = `${now.getFullYear()}-12-31`;
    } else if (preset === "ALL_TIME") {
      start = "";
      end = "";
    }

    if (preset !== "CUSTOM") {
      setStartDate(start);
      setEndDate(end);
      if (onFilterChange) {
        onFilterChange({ ...safeFilters, preset, start_date: start, end_date: end, sort: sortOrder });
      } else {
        router.get(
          window.location.pathname,
          { ...safeFilters, preset, start_date: start, end_date: end, sort: sortOrder },
          { preserveState: true, replace: true }
        );
      }
    }
  };

  const handleSortChange = (newSort) => {
    setSortOrder(newSort);
    if (onFilterChange) {
      onFilterChange({ ...safeFilters, preset: selectedPreset, start_date: startDate, end_date: endDate, sort: newSort });
    } else {
      router.get(
        window.location.pathname,
        { ...safeFilters, preset: selectedPreset, start_date: startDate, end_date: endDate, sort: newSort },
        { preserveState: true, replace: true }
      );
    }
  };

  const handleCustomApply = (e) => {
    e.preventDefault();
    if (onFilterChange) {
      onFilterChange({ ...safeFilters, preset: "CUSTOM", start_date: startDate, end_date: endDate, sort: sortOrder });
    } else {
      router.get(
        window.location.pathname,
        { ...safeFilters, preset: "CUSTOM", start_date: startDate, end_date: endDate, sort: sortOrder },
        { preserveState: true, replace: true }
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AuthenticatedLayout>
      <Head title={`${title} - Nefco Books`} />

      <div className="space-y-5 max-w-6xl mx-auto">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/reports"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition hover:bg-slate-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Reports Center</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-xs transition"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </div>

        {/* Filters Bar (Hidden when printing) */}
        {!hideDateFilter && (
          <div className="print:hidden bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Date Presets Dropdown */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Date Range:
                  </span>
                  <select
                    value={selectedPreset}
                    onChange={(e) => applyPreset(e.target.value)}
                    className="text-xs font-semibold py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 cursor-pointer shadow-xs"
                  >
                    <option value="THIS_MONTH">This Month (Default)</option>
                    <option value="TODAY">Today</option>
                    <option value="THIS_WEEK">This Week</option>
                    <option value="THIS_QUARTER">This Quarter</option>
                    <option value="THIS_YEAR">This Year</option>
                    <option value="ALL_TIME">All Time</option>
                    <option value="CUSTOM">Custom Date Range...</option>
                  </select>
                </div>

                {/* Date Sorting Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Sort:
                  </span>
                  <select
                    value={sortOrder}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="text-xs font-medium py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-700 cursor-pointer shadow-xs"
                  >
                    <option value="DESC">Newest First (Desc)</option>
                    <option value="ASC">Oldest First (Asc)</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Form */}
              {selectedPreset === "CUSTOM" && (
                <form onSubmit={handleCustomApply} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none shadow-xs font-mono"
                    placeholder="From"
                  />
                  <span className="text-slate-400 text-xs font-medium">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none shadow-xs font-mono"
                    placeholder="To"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                  >
                    Apply Filter
                  </button>
                </form>
              )}
            </div>

            {/* Extra Contextual Filters (e.g. Customer, Vendor, Status, Account) */}
            {extraFilters && (
              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3">
                {extraFilters}
              </div>
            )}
          </div>
        )}

        {/* Report Paper Sheet Container (Designed for both Web and Print) */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6">
          {/* Official Letterhead & Title */}
          <div className="border-b border-slate-200 pb-5 text-center space-y-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight uppercase">
              {title}
            </h1>
            <div className="text-xs font-bold text-blue-600">Nefco Books Organization</div>
            <p className="text-[11px] text-slate-500">
              {subtitle || (
                startDate && endDate
                  ? `From ${startDate} to ${endDate} (Amounts in BDT)`
                  : "All Transaction History (Amounts in BDT)"
              )}
            </p>
          </div>

          {/* Report Body */}
          <div>{children}</div>

          {/* Footer note for print */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Generated in real time by Nefco Books</span>
            <span>Date: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
