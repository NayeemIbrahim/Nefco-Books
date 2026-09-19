import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { Plus, Search, Package, X } from "lucide-react";
import { Head, router } from "@inertiajs/react";

export default function ItemsIndex({ items, filters, defaultUom = "Pcs" }) {
  const [search, setSearch] = useState(filters?.search || "");
  const [typeFilter, setTypeFilter] = useState(filters?.type || "ALL");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "GOODS",
    description: "",
    sales_price: 0,
    purchase_price: 0,
    unit: defaultUom || "Pcs",
    stock_quantity: 0,
  });

  const handleOpenCreateDrawer = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      type: "GOODS",
      description: "",
      sales_price: 0,
      purchase_price: 0,
      unit: defaultUom || "Pcs",
      stock_quantity: 0,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      type: item.type || "GOODS",
      description: item.description || "",
      sales_price: parseFloat(item.sales_price) || 0,
      purchase_price: parseFloat(item.purchase_price) || 0,
      unit: item.unit || defaultUom || "Pcs",
      stock_quantity: parseFloat(item.stock_quantity) || 0,
    });
    setIsDrawerOpen(true);
  };

  const handleFilter = (t) => {
    setTypeFilter(t);
    router.get("/items", { search, type: t }, { preserveState: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get("/items", { search, type: typeFilter }, { preserveState: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      router.post(`/items/${editingItem.id}`, formData, {
        onSuccess: () => {
          setIsDrawerOpen(false);
          setEditingItem(null);
        },
      });
    } else {
      router.post("/items", formData, {
        onSuccess: () => {
          setIsDrawerOpen(false);
        },
      });
    }
  };

  const itemList = items?.data || items || [];

  return (
    <AuthenticatedLayout>
      <Head title="Items & Inventory - Nefco Books" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Items & Inventory Catalog</h1>
            <p className="text-xs text-slate-500">Manage products, services, and BDT pricing</p>
          </div>
          <button
            onClick={handleOpenCreateDrawer}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Item</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item name or SKU..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </form>

          <div className="flex items-center gap-2">
            {["ALL", "GOODS", "SERVICE"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  typeFilter === tab
                    ? "bg-slate-900 text-white font-semibold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab === "ALL" ? "All Items" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
              <tr>
                <th className="py-3 px-4">Item Name & SKU</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4 text-right">Sales Price (BDT)</th>
                <th className="py-3 px-4 text-right">Purchase Cost (BDT)</th>
                <th className="py-3 px-4 text-center">Stock Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No items in catalog. Click "New Item" to add products or services.
                  </td>
                </tr>
              ) : (
                itemList.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenEditDrawer(item)}
                    className="hover:bg-blue-50/50 cursor-pointer transition"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-blue-600 hover:underline">{item.name}</div>
                      {item.sku && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          SKU: {item.sku}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          item.type === "GOODS"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{item.unit}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatBDT(item.sales_price)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-500">
                      {item.purchase_price ? formatBDT(item.purchase_price) : "-"}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {item.type === "SERVICE" ? (
                        <span className="text-slate-400 font-sans text-[11px]">N/A</span>
                      ) : (
                        <span className="font-semibold text-slate-800">{item.stock_quantity}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingItem ? `Edit Item: ${editingItem.name}` : "Create Catalog Item"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingItem ? "Update item details and pricing" : "SKU will automatically generate (e.g. tom-001)"}
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Item / Service Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Tomato or Web Development"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="GOODS">GOODS (Physical)</option>
                      <option value="SERVICE">SERVICE (Billing)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Unit of Measure (UOM)</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g. Pcs, Kg, Box"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-semibold"
                    />
                  </div>
                </div>

                {editingItem && editingItem.sku && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs flex items-center justify-between">
                    <span className="text-slate-500 font-medium">System SKU Code:</span>
                    <span className="font-mono font-bold text-blue-700">{editingItem.sku}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief item specification..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Selling Price (BDT) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.sales_price}
                      onChange={(e) => setFormData({ ...formData, sales_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-bold text-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Purchase Price (BDT)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md text-slate-700 font-mono"
                    />
                  </div>
                </div>

                {formData.type === "GOODS" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Stock Quantity</label>
                    <input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-semibold font-mono"
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-xs"
                  >
                    Save Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
