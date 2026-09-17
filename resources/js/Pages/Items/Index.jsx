import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatBDT } from "@/lib/utils";
import { Package, Plus, Search, Tag, Layers, CheckCircle2 } from "lucide-react";
import { Head, useForm } from "@inertiajs/react";

export default function ItemsIndex({ items, categories, salesAccounts }) {
  const [showModal, setShowModal] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: "",
    sku: "",
    type: "GOODS",
    sales_price: "",
    purchase_price: "",
    unit: "PCS",
    stock_quantity: "0",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post("/items", {
      onSuccess: () => {
        setShowModal(false);
        reset();
      },
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Products & Services - Nefco Books" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products & Services Catalog</h1>
            <p className="text-xs text-slate-500">Manage goods, services, unit prices, and inventory stock levels</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Item</span>
          </button>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Sales Price</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items?.data?.length > 0 ? (
                items.data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/75 transition">
                    <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded text-slate-500">
                        <Package className="h-4 w-4" />
                      </div>
                      <span>{item.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {item.sku || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.type === "GOODS" ? "bg-cyan-50 text-cyan-700" : "bg-purple-50 text-purple-700"
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.category?.name || "General"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatBDT(item.sales_price)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {item.purchase_price ? formatBDT(item.purchase_price) : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                      {item.type === "GOODS" ? `${item.stock_quantity} ${item.unit}` : "N/A (Service)"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No items in catalog. Click "New Item" to add products or services.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Item Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Product or Service</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  placeholder="e.g. Accounting Software License, Cotton T-Shirt..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={data.type}
                    onChange={(e) => setData("type", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white text-xs"
                  >
                    <option value="GOODS">Goods (Inventory)</option>
                    <option value="SERVICE">Service</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={data.sku}
                    onChange={(e) => setData("sku", e.target.value)}
                    placeholder="SKU-1001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Sales Price (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={data.sales_price}
                    onChange={(e) => setData("sales_price", e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Purchase Cost (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={data.purchase_price}
                    onChange={(e) => setData("purchase_price", e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={data.unit}
                    onChange={(e) => setData("unit", e.target.value)}
                    placeholder="PCS, BOX, KG, HR..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    value={data.stock_quantity}
                    onChange={(e) => setData("stock_quantity", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-md font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition"
                >
                  {processing ? "Saving..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
