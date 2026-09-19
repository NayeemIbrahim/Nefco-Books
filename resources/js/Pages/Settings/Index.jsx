import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import {
  User,
  Building2,
  Coins,
  Users,
  Landmark,
  Save,
  Check,
  X,
  Plus,
  Edit,
  MessageSquare,
} from "lucide-react";
import { Head, router, usePage } from "@inertiajs/react";

export default function SettingsIndex({ profile, company, users, accounts }) {
  const { flash } = usePage().props;
  const [activeTab, setActiveTab] = useState("profile");
  const [notification, setNotification] = useState(flash?.success || null);

  // Profile Form state
  const [profileName, setProfileName] = useState(profile?.name || "");
  const [profileEmail, setProfileEmail] = useState(profile?.email || "");
  const [profilePassword, setProfilePassword] = useState("");

  // Company Form state
  const [companyName, setCompanyName] = useState(company?.company_name || "Nefco Trading & IT Ltd.");
  const [companyAddress, setCompanyAddress] = useState(company?.company_address || "Dhaka, Bangladesh");
  const [binNumber, setBinNumber] = useState(company?.bin_number || "123456789-0101");
  const [phone, setPhone] = useState(company?.phone || "+8801711223344");
  const [currencySymbol, setCurrencySymbol] = useState(company?.currency_symbol || "৳");
  const [currencyCode, setCurrencyCode] = useState(company?.currency_code || "BDT");
  const [defaultUom, setDefaultUom] = useState(company?.default_uom || "Pcs");
  const [whatsappPhoneId, setWhatsappPhoneId] = useState(company?.whatsapp_phone_number_id || "");
  const [whatsappToken, setWhatsappToken] = useState(company?.whatsapp_access_token || "");

  // Chart of Accounts state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [accountCode, setAccountCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("ASSET");
  const [accountDescription, setAccountDescription] = useState("");
  const [accountBalance, setAccountBalance] = useState("0");

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    router.post(
      "/settings/profile",
      {
        name: profileName,
        email: profileEmail,
        password: profilePassword || undefined,
      },
      {
        onSuccess: () => {
          setNotification("✅ Personal profile and login details saved successfully!");
          setProfilePassword("");
        },
      }
    );
  };

  const handleUpdateCompany = (e) => {
    e.preventDefault();
    router.post(
      "/settings/company",
      {
        company_name: companyName,
        company_address: companyAddress,
        bin_number: binNumber,
        phone: phone,
        currency_symbol: currencySymbol,
        currency_code: currencyCode,
        default_uom: defaultUom,
        whatsapp_phone_number_id: whatsappPhoneId,
        whatsapp_access_token: whatsappToken,
      },
      {
        onSuccess: () => setNotification("✅ Organization and business preferences saved!"),
      }
    );
  };

  const handleOpenCreateAccount = () => {
    setEditingAccountId(null);
    setAccountCode("");
    setAccountName("");
    setAccountType("ASSET");
    setAccountDescription("");
    setAccountBalance("0");
    setIsAccountModalOpen(true);
  };

  const handleOpenEditAccount = (acc) => {
    setEditingAccountId(acc.id);
    setAccountCode(acc.code);
    setAccountName(acc.name);
    setAccountType(acc.type);
    setAccountDescription(acc.description || "");
    setAccountBalance(acc.balance !== undefined && acc.balance !== null ? acc.balance : "0");
    setIsAccountModalOpen(true);
  };

  const handleSubmitAccount = (e) => {
    e.preventDefault();
    if (editingAccountId) {
      router.post(
        `/settings/accounts/${editingAccountId}`,
        {
          name: accountName,
          type: accountType,
          description: accountDescription,
          balance: parseFloat(accountBalance) || 0,
        },
        {
          onSuccess: () => {
            setIsAccountModalOpen(false);
            setNotification("✅ Account updated successfully!");
          },
        }
      );
    } else {
      router.post(
        "/settings/accounts",
        {
          code: accountCode,
          name: accountName,
          type: accountType,
          description: accountDescription,
          balance: parseFloat(accountBalance) || 0,
        },
        {
          onSuccess: () => {
            setIsAccountModalOpen(false);
            setNotification("✅ New account added to Chart of Accounts!");
          },
        }
      );
    }
  };

  const handleApproveUser = (userId) => {
    router.post(`/settings/users/${userId}/approve`, {}, {
      onSuccess: () => setNotification("✅ User account APPROVED! Access granted."),
    });
  };

  const handleRejectUser = (userId) => {
    router.post(`/settings/users/${userId}/reject`, {}, {
      onSuccess: () => setNotification("⚠️ User account REJECTED."),
    });
  };

  const handleToggleRole = (userId) => {
    router.post(`/settings/users/${userId}/toggle-role`, {}, {
      onSuccess: () => setNotification("✅ User role updated!"),
    });
  };

  const userList = users || [];
  const accountList = accounts || [];

  return (
    <AuthenticatedLayout>
      <Head title="Settings & Setup - Nefco Books" />

      <div className="space-y-6">
        {notification && (
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg shadow-xs">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Settings & Preferences</h1>
          <p className="text-xs text-slate-500">Manage user profile, business setup, Chart of Accounts, and system approvals</p>
        </div>

        {/* Tabs Container */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          {/* Tab Navigation Bar */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold border-b-2 transition ${
                activeTab === "profile"
                  ? "border-amber-600 text-amber-700 bg-white rounded-t-md"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="h-4 w-4" />
              <span>My Profile</span>
            </button>

            <button
              onClick={() => setActiveTab("company")}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold border-b-2 transition ${
                activeTab === "company"
                  ? "border-amber-600 text-amber-700 bg-white rounded-t-md"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Business Info</span>
            </button>

            <button
              onClick={() => setActiveTab("accounts")}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold border-b-2 transition ${
                activeTab === "accounts"
                  ? "border-amber-600 text-amber-700 bg-white rounded-t-md"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Landmark className="h-4 w-4" />
              <span>Chart of Accounts</span>
            </button>

            <button
              onClick={() => setActiveTab("currency")}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold border-b-2 transition ${
                activeTab === "currency"
                  ? "border-amber-600 text-amber-700 bg-white rounded-t-md"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Coins className="h-4 w-4" />
              <span>Currency Setup</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold border-b-2 transition ${
                activeTab === "users"
                  ? "border-amber-600 text-amber-700 bg-white rounded-t-md"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>User Approvals</span>
              {userList.filter((u) => u.status === "PENDING").length > 0 && (
                <span className="bg-amber-600 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                  {userList.filter((u) => u.status === "PENDING").length}
                </span>
              )}
            </button>
          </div>

          <div className="p-6">
            {/* TAB 1: Profile Settings */}
            {activeTab === "profile" && (
              <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Email Address *</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <h3 className="font-bold text-slate-800 text-xs">Change Password (Optional)</h3>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      placeholder="Enter new password (or leave blank to keep current)"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-md shadow-xs transition"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Profile & Login Info</span>
                </button>
              </form>
            )}

            {/* TAB 2: Business Info */}
            {activeTab === "company" && (
              <form onSubmit={handleUpdateCompany} className="max-w-2xl space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Organization / Company Name *</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Business Registration / BIN</label>
                    <input
                      type="text"
                      value={binNumber}
                      onChange={(e) => setBinNumber(e.target.value)}
                      placeholder="e.g. 001234567-0101"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+8801711223344"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Registered Business Address</label>
                    <input
                      type="text"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Motijheel C/A, Dhaka 1000"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    <span>Meta WhatsApp Cloud API Integration Keys</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">WhatsApp Phone Number ID</label>
                      <input
                        type="text"
                        value={whatsappPhoneId}
                        onChange={(e) => setWhatsappPhoneId(e.target.value)}
                        placeholder="10928374659102"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Permanent Access Token</label>
                      <input
                        type="password"
                        value={whatsappToken}
                        onChange={(e) => setWhatsappToken(e.target.value)}
                        placeholder="EAAB..."
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-md shadow-xs transition"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Organization Details</span>
                </button>
              </form>
            )}

            {/* TAB 3: Chart of Accounts */}
            {activeTab === "accounts" && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Chart of Accounts (General Ledger)</h3>
                    <p className="text-slate-500">Configure financial account codes, names, and double-entry classifications</p>
                  </div>
                  <button
                    onClick={handleOpenCreateAccount}
                    className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-md shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Account</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Code</th>
                        <th className="py-2.5 px-4">Account Name</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4 text-right">Running Balance</th>
                        <th className="py-2.5 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accountList.map((acc) => (
                        <tr key={acc.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-4 font-mono font-bold text-amber-700">{acc.code}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{acc.name}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                acc.type === "ASSET"
                                  ? "bg-blue-100 text-blue-800"
                                  : acc.type === "LIABILITY"
                                  ? "bg-red-100 text-red-800"
                                  : acc.type === "EQUITY"
                                  ? "bg-purple-100 text-purple-800"
                                  : acc.type === "REVENUE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {acc.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                            {formatBDT(acc.balance || 0)}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() => handleOpenEditAccount(acc)}
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded"
                              title="Edit Account"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: Currency & Locale */}
            {activeTab === "currency" && (
              <form onSubmit={handleUpdateCompany} className="max-w-xl space-y-4 text-xs">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1">
                  <h3 className="font-bold text-xs">Bangladeshi Taka (BDT) Financial Engine</h3>
                  <p className="text-[11px] text-amber-800">
                    All balances, customer invoices, and general ledger reports compute using strict double-entry standards in Bangladeshi Taka (৳).
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Currency Symbol *</label>
                    <input
                      type="text"
                      required
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Currency ISO Code *</label>
                    <input
                      type="text"
                      required
                      value={currencyCode}
                      onChange={(e) => setCurrencyCode(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Default Unit of Measure (UOM)</label>
                    <input
                      type="text"
                      required
                      value={defaultUom}
                      onChange={(e) => setDefaultUom(e.target.value)}
                      placeholder="e.g. Pcs, Kg, Unit"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-md shadow-xs transition"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Currency Setup</span>
                </button>
              </form>
            )}

            {/* TAB 5: User Management & Approvals */}
            {activeTab === "users" && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">System Users & Access Requests</h3>
                  <span className="text-slate-500">Administrators can approve/reject registrations</span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">User Name</th>
                        <th className="py-2.5 px-4">Email</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                          <td className="py-3 px-4 text-slate-600">{u.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                u.role === "admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {u.role?.toUpperCase() || "STAFF"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                u.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : u.status === "REJECTED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {u.status || "APPROVED"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {u.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleApproveUser(u.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] inline-flex items-center gap-1 shadow-xs"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleRejectUser(u.id)}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-[11px] inline-flex items-center gap-1 shadow-xs"
                                >
                                  <X className="h-3 w-3" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => handleToggleRole(u.id)}
                              className="px-2 py-1 border border-slate-300 hover:bg-slate-100 font-semibold rounded text-[10px] text-slate-700"
                            >
                              Toggle {u.role === "admin" ? "Staff" : "Admin"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Modal (Create / Edit) */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingAccountId ? "Edit Ledger Account" : "Create New Ledger Account"}
              </h3>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAccount} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Code *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingAccountId}
                  value={accountCode}
                  onChange={(e) => setAccountCode(e.target.value)}
                  placeholder="e.g. 1030, 5010, 6050"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-mono disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Nagad Merchant Wallet"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Classification / Type *</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="ASSET">ASSET (Cash, Bank, Receivables)</option>
                  <option value="LIABILITY">LIABILITY (Accounts Payable, Loans)</option>
                  <option value="EQUITY">EQUITY (Owner's Capital, Retained Earnings)</option>
                  <option value="REVENUE">REVENUE (Sales, Services)</option>
                  <option value="EXPENSE">EXPENSE (Cost of Goods, Operating Expenses)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Account Amount / Balance (BDT ৳) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Editable account amount (no dummy or pre-defined amounts).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={accountDescription}
                  onChange={(e) => setAccountDescription(e.target.value)}
                  placeholder="Notes about this account..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold shadow-xs"
                >
                  {editingAccountId ? "Save Changes" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
