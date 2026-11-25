import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Pagination from "@/Components/Pagination";
import { formatBDT } from "@/lib/utils";
import {
  Plus,
  Search,
  Package,
  X,
  Trash2,
  Edit,
  ShoppingCart,
  Tag,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { Head, router, usePage } from "@inertiajs/react";

/**
 * Safely round numbers to 2 decimal places.
 */
function roundNum(num) {
  const n = parseFloat(num) || 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Items & Inventory Catalog View Component
 *
 * Features:
 * - Dynamic Category categorization replacing rigid goods/service types
 * - Category filter and sorting options
 * - Delete catalog items with safe null-on-delete
 * - Opt-in Stock Tracking toggle (hidden by default unless enabled in Settings)
 * - Quick Sell Counter Sales modal for "Walk-in Customer" (no phone required)
 */
export default function ItemsIndex({
  items = {},
  categories = [],
  customers = [],
  salesAccounts = [],
  payment_accounts = [],
  defaultUom = "Pcs",
  enable_stock = false,
  filters = {},
}) {
  // Safe extraction of page props
  const pageProps = usePage()?.props || {};
  const flash = pageProps.flash || {};
  const [notification, setNotification] = useState(flash?.success || null);

  // Safe normalize input props to arrays to avoid runtime crashes
  const categoryList = Array.isArray(categories)
    ? categories
    : (categories && typeof categories === "object" ? Object.values(categories) : []);

  const customerList = Array.isArray(customers)
    ? customers
    : (customers && typeof customers === "object" ? Object.values(customers) : []);

  const paymentAccountList = Array.isArray(payment_accounts)
    ? payment_accounts
    : (payment_accounts && typeof payment_accounts === "object" ? Object.values(payment_accounts) : []);

  const itemList = Array.isArray(items?.data)
    ? items.data
    : (Array.isArray(items) ? items : []);

  const safeFilters = (filters && typeof filters === "object" && !Array.isArray(filters))
    ? filters
    : {};

  // Search & Filter State
  const [search, setSearch] = useState(safeFilters.search || "");
  const [categoryFilter, setCategoryFilter] = useState(safeFilters.category_id || "ALL");
  const [sortFilter, setSortFilter] = useState(safeFilters.sort || "latest");

  // Drawer (Create/Edit Item) State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Quick Sell Modal state
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellItem, setSellItem] = useState(null);
  const [sellContactId, setSellContactId] = useState("");
  const [sellCustomerName, setSellCustomerName] = useState("Walk-in Customer");
  const [isCustomCustomer, setIsCustomCustomer] = useState(false);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellUnitPrice, setSellUnitPrice] = useState(0);
  const [sellDepositAccountId, setSellDepositAccountId] = useState(
    paymentAccountList[0]?.id || ""
  );
  const [sellPaymentMethod, setSellPaymentMethod] = useState("CASH");
  const [sellNotes, setSellNotes] = useState("");
  const [isSubmittingSell, setIsSubmittingSell] = useState(false);

  // Item Form State
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    type: "GOODS",
    description: "",
    sales_price: 0,
    purchase_price: 0,
    unit: defaultUom || "Pcs",
    stock_quantity: 0,
  });

  /**
   * Open drawer to create a new item
   */
  const handleOpenCreateDrawer = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      category_id: categoryList[0]?.id || "",
      type: "GOODS",
      description: "",
      sales_price: 0,
      purchase_price: 0,
      unit: defaultUom || "Pcs",
      stock_quantity: 0,
    });
    setIsDrawerOpen(true);
  };

  /**
   * Open drawer to edit an existing item
   */
  const handleOpenEditDrawer = (item) => {
    if (!item) return;
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      category_id: item.category_id || "",
      type: item.type || "GOODS",
      description: item.description || "",
      sales_price: parseFloat(item.sales_price) || 0,
      purchase_price: parseFloat(item.purchase_price) || 0,
      unit: item.unit || defaultUom || "Pcs",
      stock_quantity: parseFloat(item.stock_quantity) || 0,
    });
    setIsDrawerOpen(true);
  };

  /**
   * Handle filter category selection
   */
  const handleCategoryFilterChange = (catId) => {
    setCategoryFilter(catId);
    router.get(
      "/items",
      { search, category_id: catId, sort: sortFilter },
      { preserveState: true }
    );
  };

  /**
   * Handle sorting selection
   */
  const handleSortChange = (newSort) => {
    setSortFilter(newSort);
    router.get(
      "/items",
      { search, category_id: categoryFilter, sort: newSort },
      { preserveState: true }
    );
  };

  /**
   * Handle text search
   */
  const handleSearch = (e) => {
    e.preventDefault();
    router.get(
      "/items",
      { search, category_id: categoryFilter, sort: sortFilter },
      { preserveState: true }
    );
  };

  /**
   * Submit item create or update
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      router.post(`/items/${editingItem.id}`, formData, {
        preserveScroll: true,
        onSuccess: () => {
          setIsDrawerOpen(false);
          setEditingItem(null);
          setNotification("✅ Item updated successfully!");
        },
      });
    } else {
      router.post("/items", formData, {
        preserveScroll: true,
        onSuccess: () => {
          setIsDrawerOpen(false);
          setNotification("✅ New catalog item created!");
        },
      });
    }
  };

  /**
   * Delete item with confirmation
   */
  const handleDeleteItem = (item, e) => {
    e.stopPropagation();
    if (!item) return;
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      router.delete(`/items/${item.id}`, {
        preserveScroll: true,
        onSuccess: () => setNotification(`✅ Item "${item.name}" deleted.`),
      });
    }
  };

  /**
   * Open Quick Sell modal for immediate counter cash sale
   */
  const handleOpenSell = (item, e) => {
    e.stopPropagation();
    if (!item) return;
    setSellItem(item);
    setSellContactId("");
    setSellCustomerName("Walk-in Customer");
    setIsCustomCustomer(false);
    setSellQuantity(1);
    setSellUnitPrice(parseFloat(item.sales_price) || 0);
    setSellDepositAccountId(paymentAccountList[0]?.id || "");
    setSellPaymentMethod("CASH");
    setSellNotes("");
    setIsSellModalOpen(true);
  };

  /**
   * Submit Quick Sell counter sale
   */
  const handleQuickSellSubmit = (e) => {
    e.preventDefault();
    if (!sellItem) return;
    setIsSubmittingSell(true);
    router.post(
      "/items/quick-sell",
      {
        item_id: sellItem.id,
        quantity: sellQuantity,
        unit_price: sellUnitPrice,
        contact_id: sellContactId || undefined,
        customer_name: isCustomCustomer
          ? sellCustomerName
          : (sellContactId ? "" : (sellCustomerName || "Walk-in Customer")),
        deposit_account_id: sellDepositAccountId,
        payment_method: sellPaymentMethod,
        notes: sellNotes,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsSellModalOpen(false);
          setIsSubmittingSell(false);
          setNotification("✅ Sale recorded! Cash invoice created successfully.");
        },
        onError: () => {
          setIsSubmittingSell(false);
        },
      }
    );
  };

  // Compute sale total
  const sellTotal = roundNum(
    (parseFloat(sellQuantity) || 0) * (parseFloat(sellUnitPrice) || 0)
  );

  return (
    <AuthenticatedLayout>
      <Head title="Items & Inventory - Nefco Books" />

      <div className="space-y-6">
        {/* Flash notification banner */}
        {notification && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center justify-between shadow-xs">
            <span>{notification}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-emerald-600 hover:text-emerald-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Items & Inventory Catalog
              </h1>
              {enable_stock ? (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Stock Tracking ON
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Standard Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Manage catalog products, pricing, categories, and direct counter sales
            </p>
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
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <form onSubmit={handleSearch} className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item name or SKU..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Categories</option>
                {categoryList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
                <option value="UNCATEGORIZED">Uncategorized</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">Sort:</span>
              <select
                value={sortFilter}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="latest">Latest Added</option>
                <option value="category">Sort by Category</option>
                <option value="name">Name (A-Z)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-xs text-left text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500">
                <tr>
                  <th className="py-3 px-4">Item Name & SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Sales Price (BDT)</th>
                  <th className="py-3 px-4 text-right">Purchase Cost (BDT)</th>
                  {enable_stock && <th className="py-3 px-4 text-center">Stock Available</th>}
                  <th className="py-3 px-4 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={enable_stock ? 7 : 6}
                      className="py-8 text-center text-slate-400"
                    >
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
                        <div className="font-semibold text-blue-600 hover:underline">
                          {item.name}
                        </div>
                        {item.sku && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            SKU: {item.sku}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category?.name || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{item.unit || "Pcs"}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatBDT(item.sales_price)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-500">
                        {item.purchase_price ? formatBDT(item.purchase_price) : "-"}
                      </td>
                      {enable_stock && (
                        <td className="py-3 px-4 text-center font-mono">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              parseFloat(item.stock_quantity) <= 0
                                ? "bg-red-50 text-red-700"
                                : "bg-emerald-50 text-emerald-800"
                            }`}
                          >
                            {item.stock_quantity ?? 0}
                          </span>
                        </td>
                      )}
                      <td
                        className="py-3 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Sell Button */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenSell(item, e)}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded shadow-xs text-[11px] transition"
                            title="Sell this item directly to Walk-in Customer"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            <span>Sell</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditDrawer(item)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                            title="Edit Item"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteItem(item, e)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                            title="Delete Item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination meta={items} />
        </div>

        {/* Drawer for Create / Edit Item */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingItem ? `Edit Item: ${editingItem.name}` : "Create Catalog Item"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingItem
                      ? "Update item details and category"
                      : "SKU will automatically generate (e.g. tom-001)"}
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
                  <label className="text-xs font-semibold text-slate-700">
                    Item / Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Fresh Tomatoes, AC Service, USB Cable..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) =>
                        setFormData({ ...formData, category_id: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">General / None</option>
                      {categoryList.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Unit of Measure (UOM)
                    </label>
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
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief item specification or notes..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Selling Price (BDT) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.sales_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sales_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-bold text-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Purchase Cost (BDT)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchase_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md text-slate-700 font-mono"
                    />
                  </div>
                </div>

                {/* Stock Quantity - Only shown when Stock Feature is Enabled in Settings */}
                {enable_stock && (
                  <div className="space-y-1 p-3 bg-amber-50/60 border border-amber-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800">
                        Initial / Current Stock
                      </label>
                      <span className="text-[10px] text-amber-800 font-medium">
                        Stock Tracking Enabled
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.stock_quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stock_quantity: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-semibold font-mono bg-white"
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

        {/* Quick Sell Modal (Walk-in Customer Cash Sale) */}
        {isSellModalOpen && sellItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Quick Sell: {sellItem.name}
                  </h3>
                </div>
                <button
                  onClick={() => setIsSellModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleQuickSellSubmit} className="p-5 space-y-4 text-xs">
                {/* Customer field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Select Customer</label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Walk-in requires no phone
                    </span>
                  </div>
                  <select
                    value={isCustomCustomer ? "__CUSTOM__" : (sellContactId || "")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__CUSTOM__") {
                        setIsCustomCustomer(true);
                        setSellContactId("");
                        setSellCustomerName("");
                      } else if (val === "") {
                        setIsCustomCustomer(false);
                        setSellContactId("");
                        setSellCustomerName("Walk-in Customer");
                      } else {
                        setIsCustomCustomer(false);
                        setSellContactId(val);
                        const found = customerList.find((c) => String(c.id) === String(val));
                        setSellCustomerName(found ? found.name : "");
                      }
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                  >
                    <option value="">🚶 Walk-in Customer (Cash / Counter)</option>
                    {customerList.length > 0 && (
                      <optgroup label="Registered Customers">
                        {customerList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : (c.whatsapp_number ? `(${c.whatsapp_number})` : "")}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <option value="__CUSTOM__">+ Other / Enter New Customer Name...</option>
                  </select>

                  {isCustomCustomer && (
                    <input
                      type="text"
                      required
                      value={sellCustomerName}
                      onChange={(e) => setSellCustomerName(e.target.value)}
                      placeholder="Enter customer name..."
                      className="w-full text-xs px-3 py-2 border border-emerald-400 rounded-md focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800 mt-1"
                      autoFocus
                    />
                  )}

                  {!isCustomCustomer && sellContactId && (
                    <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 flex items-center justify-between">
                      <span>Selected Contact:</span>
                      <span className="font-semibold text-slate-700">
                        {customerList.find((c) => String(c.id) === String(sellContactId))?.phone
                          ? `Phone: ${customerList.find((c) => String(c.id) === String(sellContactId))?.phone}`
                          : "No phone recorded"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Item Details Card */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{sellItem.name}</span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {sellItem.sku || "NO SKU"}
                    </span>
                  </div>
                  {enable_stock && (
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Available Stock:</span>
                      <span className="font-bold text-slate-800">
                        {sellItem.stock_quantity ?? 0} {sellItem.unit || "Pcs"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quantity and Unit Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Quantity ({sellItem.unit || "Pcs"}) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      value={sellQuantity}
                      onChange={(e) => setSellQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Unit Price (BDT) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={sellUnitPrice}
                      onChange={(e) => setSellUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-bold font-mono"
                    />
                  </div>
                </div>

                {/* Total amount highlight */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-900">
                    Total Sale Amount:
                  </span>
                  <span className="text-base font-extrabold text-emerald-700 font-mono">
                    {formatBDT(sellTotal)}
                  </span>
                </div>

                {/* Payment Account and Method */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Received Into *
                    </label>
                    <select
                      value={sellDepositAccountId}
                      onChange={(e) => setSellDepositAccountId(e.target.value)}
                      required
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                    >
                      {paymentAccountList.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={sellPaymentMethod}
                      onChange={(e) => setSellPaymentMethod(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                    >
                      <option value="CASH">Cash</option>
                      <option value="MOBILE_BANKING">bKash / Nagad / Rocket</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sale Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={sellNotes}
                    onChange={(e) => setSellNotes(e.target.value)}
                    placeholder="e.g. Counter sale receipt..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsSellModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSell || sellTotal <= 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    <span>
                      {isSubmittingSell ? "Recording..." : "Record Sale & Issue Invoice"}
                    </span>
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
