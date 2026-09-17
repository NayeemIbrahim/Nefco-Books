import React from "react";
import { Sidebar } from "@/Components/Sidebar";
import { Header } from "@/Components/Header";

export default function AuthenticatedLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
