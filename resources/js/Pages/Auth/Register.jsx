import React from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { BookOpen, Lock, Mail, User, ShieldAlert, ArrowRight } from "lucide-react";

export default function Register() {
  const { data, setData, post, processing, errors } = useForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post("/register");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <Head title="Register Account - Nefco Books" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400 mb-2">
          <BookOpen className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Create Account</h2>
        <p className="text-xs text-slate-400">Join Nefco Books Cloud Accounting Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 py-8 px-6 shadow-2xl border border-slate-700/60 rounded-xl sm:px-10 space-y-6 backdrop-blur-md">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] rounded-lg flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Admin Approval Notice:</strong> New accounts require Administrator approval before full login access is granted.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  placeholder="Nayeem Ibrahim"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
                />
              </div>
              {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
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
                  placeholder="Minimum 8 characters"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
                />
              </div>
              {errors.password && <p className="text-[11px] text-red-400 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={data.password_confirmation}
                  onChange={(e) => setData("password_confirmation", e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs shadow-lg transition duration-150 disabled:opacity-50 mt-2"
            >
              <span>Submit Registration</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-700/60 text-center text-xs text-slate-400">
            <span>Already registered? </span>
            <Link href="/login" className="text-amber-400 hover:text-amber-300 font-bold underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
