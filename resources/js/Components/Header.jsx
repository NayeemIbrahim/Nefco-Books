import React from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { Search, Bell, User, LogOut, Settings } from "lucide-react";

export function Header() {
  const { auth } = usePage().props;
  const currentUser = auth?.user;

  const handleLogout = () => {
    router.post("/logout");
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts, invoices, bookings..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-md text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Currency: BDT (Bangladeshi Taka ৳)</span>
        </div>

        <Link
          href="/settings"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition flex items-center gap-1 text-xs font-semibold"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs border border-slate-700">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-900">{currentUser?.name || "Admin Account"}</div>
            <div className="text-[10px] text-slate-500 font-semibold">{currentUser?.email || "admin@nefcobooks.com"}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition ml-1"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
