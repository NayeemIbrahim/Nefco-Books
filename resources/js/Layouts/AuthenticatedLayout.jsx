import React, { useState } from "react";
import { Sidebar } from "@/Components/Sidebar";
import { Header } from "@/Components/Header";

export default function AuthenticatedLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
