import React, { useState, useEffect, useRef } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import {
  Search,
  Menu,
  LogOut,
  Settings,
  X,
  FileText,
  Receipt,
  Users,
  Package,
  CalendarCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";

export function Header({ onToggleSidebar }) {
  const { auth } = usePage().props;
  const currentUser = auth?.user;

  // Global Search State
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  const handleLogout = () => {
    router.post("/logout");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsDropdownOpen(true);
        }
      } catch (err) {
        console.error("Search fetch error", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsDropdownOpen(false);
    router.get("/sales/invoices", { search: query.trim() });
  };

  const handleItemClick = () => {
    setIsDropdownOpen(false);
    setQuery("");
  };

  const hasResults =
    results &&
    (results.invoices?.length > 0 ||
      results.bills?.length > 0 ||
      results.contacts?.length > 0 ||
      results.items?.length > 0 ||
      results.bookings?.length > 0);

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-lg relative" ref={searchContainerRef}>
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Live Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results && query.trim()) setIsDropdownOpen(true);
            }}
            placeholder="Search invoices, bills, customers, items, bookings... (Press Enter)"
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition text-slate-800 placeholder-slate-400 font-medium"
          />
          {isLoading ? (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults(null);
                setIsDropdownOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </form>

        {/* Live Search Floating Dropdown */}
        {isDropdownOpen && query.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 text-xs divide-y divide-slate-100 max-h-[80vh] overflow-y-auto animate-in fade-in duration-100">
            {!hasResults && !isLoading && (
              <div className="p-4 text-center text-slate-400 text-xs">
                No matching records found for "{query}".
              </div>
            )}

            {/* Invoices */}
            {results?.invoices?.length > 0 && (
              <div className="p-2 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-blue-500" />
                  <span>Invoices</span>
                </div>
                {results.invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/sales/invoices?search=${encodeURIComponent(inv.invoice_number)}`}
                    onClick={handleItemClick}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition text-slate-700 hover:text-blue-900 group"
                  >
                    <div>
                      <div className="font-mono font-bold text-blue-600 text-xs">{inv.invoice_number}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{inv.contact?.name || "Customer"}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-800">৳{parseFloat(inv.total_amount).toLocaleString()}</span>
                      <span className="text-[9px] block font-semibold text-slate-400 uppercase">{inv.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Bills */}
            {results?.bills?.length > 0 && (
              <div className="p-2 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="h-3 w-3 text-amber-500" />
                  <span>Vendor Bills</span>
                </div>
                {results.bills.map((bill) => (
                  <Link
                    key={bill.id}
                    href={`/purchases/bills?search=${encodeURIComponent(bill.bill_number)}`}
                    onClick={handleItemClick}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-amber-50 transition text-slate-700 hover:text-amber-900 group"
                  >
                    <div>
                      <div className="font-mono font-bold text-amber-700 text-xs">{bill.bill_number}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{bill.contact?.name || "Vendor"}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-800">৳{parseFloat(bill.total_amount).toLocaleString()}</span>
                      <span className="text-[9px] block font-semibold text-slate-400 uppercase">{bill.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Contacts (Customers / Vendors) */}
            {results?.contacts?.length > 0 && (
              <div className="p-2 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-emerald-500" />
                  <span>Contacts (Customers & Vendors)</span>
                </div>
                {results.contacts.map((c) => (
                  <Link
                    key={c.id}
                    href={
                      c.type === "VENDOR"
                        ? `/reports/vendor-statement?contact_id=${c.id}`
                        : `/reports/customer-statement?contact_id=${c.id}`
                    }
                    onClick={handleItemClick}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition text-slate-700 hover:text-emerald-900 group"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-400">{c.phone || c.whatsapp_number || "No phone"}</div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {c.type === "VENDOR" ? "Vendor Statement →" : "Customer Statement →"}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Bookings / Deals */}
            {results?.bookings?.length > 0 && (
              <div className="p-2 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarCheck className="h-3 w-3 text-indigo-500" />
                  <span>Bookings & Quotes</span>
                </div>
                {results.bookings.map((bkg) => (
                  <Link
                    key={bkg.id}
                    href={`/sales/bookings?search=${encodeURIComponent(bkg.booking_number)}`}
                    onClick={handleItemClick}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition text-slate-700 hover:text-indigo-900 group"
                  >
                    <div>
                      <div className="font-mono font-bold text-indigo-600 text-xs">{bkg.booking_number}</div>
                      <div className="text-[11px] text-slate-500">{bkg.contact?.name || "Customer"}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-800">৳{parseFloat(bkg.total_amount).toLocaleString()}</span>
                      <span className="text-[9px] block font-semibold text-slate-400 uppercase">{bkg.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Items & Inventory */}
            {results?.items?.length > 0 && (
              <div className="p-2 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="h-3 w-3 text-purple-500" />
                  <span>Items & Products</span>
                </div>
                {results.items.map((it) => (
                  <Link
                    key={it.id}
                    href={`/items?search=${encodeURIComponent(it.name)}`}
                    onClick={handleItemClick}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-purple-50 transition text-slate-700 hover:text-purple-900 group"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{it.name}</div>
                      {it.sku && <div className="text-[10px] text-slate-400 font-mono">SKU: {it.sku}</div>}
                    </div>
                    <span className="font-mono font-bold text-slate-800">৳{parseFloat(it.selling_price || 0).toLocaleString()}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Bottom View All Link */}
            {hasResults && (
              <div className="p-2 bg-slate-50 text-center">
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 w-full"
                >
                  <span>Search all invoices for "{query}"</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-md text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>BDT (৳)</span>
        </div>

        <Link
          href="/settings"
          className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition flex items-center gap-1 text-xs font-semibold"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs border border-slate-700">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{currentUser?.name || "Admin"}</div>
            <div className="text-[10px] text-slate-500 font-semibold truncate max-w-[120px]">{currentUser?.email || "admin@nefcobooks.com"}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
