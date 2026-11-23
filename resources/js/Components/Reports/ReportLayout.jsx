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
  const [selectedPreset, setSelectedPreset] = React.useState(filters.preset || "THIS_MONTH");
  const [startDate, setStartDate] = React.useState(filters.start_date || "");
  const [endDate, setEndDate] = React.useState(filters.end_date || "");

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
        onFilterChange({ ...filters, preset, start_date: start, end_date: end });
      } else {
        router.get(
          window.location.pathname,
          { ...filters, preset, start_date: start, end_date: end },
          { preserveState: true, replace: true }
        );
      }
    }
  };

  const handleCustomApply = (e) => {
    e.preventDefault();
    if (onFilterChange) {
      onFilterChange({ ...filters, preset: "CUSTOM", start_date: startDate, end_date: endDate });
    } else {
      router.get(
        window.location.pathname,
        { ...filters, preset: "CUSTOM", start_date: startDate, end_date: endDate },
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
              {/* Date Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Date:
                </span>
                {[
                  { id: "TODAY", label: "Today" },
                  { id: "THIS_WEEK", label: "This Week" },
                  { id: "THIS_MONTH", label: "This Month" },
                  { id: "THIS_QUARTER", label: "This Quarter" },
                  { id: "THIS_YEAR", label: "This Year" },
                  { id: "ALL_TIME", label: "All Time" },
                  { id: "CUSTOM", label: "Custom Range" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                      selectedPreset === p.id
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Form */}
              {selectedPreset === "CUSTOM" && (
                <form onSubmit={handleCustomApply} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs py-1 px-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="From"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs py-1 px-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="To"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md shadow-xs transition"
                  >
                    Apply
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
