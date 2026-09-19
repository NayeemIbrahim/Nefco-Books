import React, { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { BookOpen, Lock, Mail, ShieldCheck, ArrowRight } from "lucide-react";

export default function Login({ status }) {
  const { data, setData, post, processing, errors } = useForm({
    email: "admin@nefcobooks.com",
    password: "admin",
    remember: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post("/login");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <Head title="Sign In - Nefco Books" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400 mb-2">
          <BookOpen className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Nefco Books</h2>
        <p className="text-xs text-slate-400">Cloud Accounting & Business Management System (BDT ৳)</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 py-8 px-6 shadow-2xl border border-slate-700/60 rounded-xl sm:px-10 space-y-6 backdrop-blur-md">
          {status && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg">
              {status}
            </div>
          )}

          {errors.email && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg">
              {errors.email}
            </div>
          )}

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-lg flex items-center justify-between">
            <div>
              <span className="font-bold">Default Admin:</span> admin@nefcobooks.com / admin
            </div>
            <button
              type="button"
              onClick={() => {
                setData((prev) => ({ ...prev, email: "admin@nefcobooks.com", password: "admin" }));
              }}
              className="text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-1 rounded"
            >
              Fill
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                  placeholder="admin@nefcobooks.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={data.password}
                  onChange={(e) => setData("password", e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.remember}
                  onChange={(e) => setData("remember", e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs shadow-lg transition duration-150 disabled:opacity-50"
            >
              <span>Sign In to Organization</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-700/60 text-center text-xs text-slate-400">
            <span>Don't have an account? </span>
            <Link href="/register" className="text-amber-400 hover:text-amber-300 font-bold underline">
              Register New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
