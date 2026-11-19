import React from "react";
import { Link } from "@inertiajs/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ meta, className = "" }) {
  if (!meta) return null;

  const links = meta.links || meta.meta?.links || [];
  const from = meta.from || 0;
  const to = meta.to || 0;
  const total = meta.total ?? (meta.data ? meta.data.length : 0);
  const currentPage = meta.current_page || 1;
  const lastPage = meta.last_page || 1;

  const cleanLabel = (raw) => {
    if (!raw) return "";
    return raw
      .replace(/&laquo;\s*/gi, "")
      .replace(/\s*&raquo;/gi, "")
      .replace(/Previous/gi, "Prev")
      .trim();
  };

  return (
    <div
      className={`px-4 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <span>Showing</span>
        <span className="font-semibold text-slate-900">{from}</span>
        <span>to</span>
        <span className="font-semibold text-slate-900">{to}</span>
        <span>of</span>
        <span className="font-semibold text-slate-900">{total}</span>
        <span>entries</span>
        <span className="text-[11px] text-slate-400 ml-1 font-mono">(15 / page)</span>
      </div>

      {links.length > 0 && lastPage > 1 && (
        <nav className="inline-flex items-center -space-x-px rounded-md shadow-2xs isolate">
          {links.map((link, idx) => {
            const isPrev = idx === 0;
            const isNext = idx === links.length - 1;
            const isEllipsis = link.label.includes("...");

            if (!link.url && !link.active) {
              return (
                <span
                  key={idx}
                  className={`relative inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-300 bg-white border border-slate-200 cursor-not-allowed ${
                    isPrev ? "rounded-l-md" : ""
                  } ${isNext ? "rounded-r-md" : ""}`}
                >
                  {isPrev ? (
                    <ChevronLeft className="h-3.5 w-3.5" />
                  ) : isNext ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                  ) : (
                    cleanLabel(link.label)
                  )}
                </span>
              );
            }

            if (isEllipsis) {
              return (
                <span
                  key={idx}
                  className="relative inline-flex items-center px-3 py-1.5 text-xs text-slate-400 bg-white border border-slate-200"
                >
                  ...
                </span>
              );
            }

            if (link.active) {
              return (
                <span
                  key={idx}
                  aria-current="page"
                  className="relative z-10 inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-blue-600 border border-blue-600 focus:z-20"
                >
                  {cleanLabel(link.label)}
                </span>
              );
            }

            return (
              <Link
                key={idx}
                href={link.url}
                preserveState
                preserveScroll
                className={`relative inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 focus:z-20 transition ${
                  isPrev ? "rounded-l-md" : ""
                } ${isNext ? "rounded-r-md" : ""}`}
              >
                {isPrev ? (
                  <span className="flex items-center gap-1">
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                  </span>
                ) : isNext ? (
                  <span className="flex items-center gap-1">
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  cleanLabel(link.label)
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
