"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  CalendarCheck,
  FileText,
  CreditCard,
  Landmark,
  BarChart3,
  BookOpen,
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
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 min-h-screen">
      {/* Brand Header */}
      <div className="flex items-center gap-3 h-16 px-6 bg-slate-950 border-b border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
          NB
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-white">Nefco Books</h1>
          <p className="text-[10px] text-slate-400 font-medium">Cloud Accounting</p>
        </div>
      </div>

      {/* Navigation items */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Modules
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all duration-150",
                isActive
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer / Badge */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Currency Base</span>
          <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded font-mono font-bold">BDT (৳)</span>
        </div>
      </div>
    </div>
  );
}
