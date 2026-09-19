import React from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Contacts (CRM)", href: "/contacts", icon: Users },
  { name: "Items & Inventory", href: "/items", icon: Package },
  { name: "Bookings & Orders", href: "/bookings", icon: CalendarCheck },
  { name: "Invoices & Sales", href: "/sales/invoices", icon: FileText },
  { name: "Bills & Purchases", href: "/purchases/bills", icon: CreditCard },
  { name: "Banking & Ledger", href: "/banking", icon: Landmark },
  { name: "Financial Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings & Setup", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const { url } = usePage();

  return (
    <div className="flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 min-h-screen shrink-0">
      <div className="flex items-center gap-3 h-16 px-6 bg-slate-950 border-b border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center font-bold text-white shadow-md">
          NB
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-white">Nefco Books</h1>
          <p className="text-[10px] text-slate-400 font-medium">Cloud Accounting</p>
        </div>
      </div>

      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Modules
        </div>
        {navigation.map((item) => {
          const isActive = item.href === "/" ? url === "/" : url.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all duration-150",
                isActive
                  ? "bg-amber-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
