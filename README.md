# Nefco Books 📚

> **Cloud Accounting, ERP & Business Management Application for Bangladeshi Businesses**  
> Inspired by the clean, desktop aesthetic of **Zoho Books**, powered by **Laravel 11**, **Inertia.js (React 18)**, and **MySQL**, strictly adhering to standard double-entry accounting in **Bangladeshi Taka (৳)**.

---

## 🚀 Key Highlights & Architectural Strengths

- **Strict Double-Entry General Ledger**: All financial events (invoices, bills, payments, expenses, opening balances, and manual journals) post balanced debits and credits (`Debit = Credit`).
- **Synchronized Accounts**: The Chart of Accounts, Banking Ledger, and Reports Center share a single source of truth computed directly from journal line items.
- **Zoho Books-Style Reports Center**: 21 double-entry financial reports with live instant search, starred favorites, quick date ranges (Today, This Week, This Month, This Year, Custom), and Print/PDF export.
- **Dynamic Category Architecture**: Item and expense categories are fully customizable in Settings & Setup without hardcoded restrictions.
- **Opt-In Inventory & Stock Tracking**: Stock quantity tracking is disabled by default for simplified service businesses and can be enabled with one toggle in Settings.
- **Quick Sell / Counter POS**: Direct retail sale action on catalog items supporting **Walk-in Customer** (no phone or WhatsApp required) as well as existing registered customers.
- **Customer & Vendor Opening Balances**: Seamlessly record opening balances with automated double-entry posting against **Opening Balance Equity (`3000`)**.
- **Direct WhatsApp Action Integration**: Instant 1-click sharing of invoices, receipts, and statements via device WhatsApp / WhatsApp Business app and WhatsApp Web (`wa.me`) without requiring Meta Cloud API keys, tokens, or fees.
- **Native Hosting Architecture**: Runs natively on standard LAMP/cPanel/DirectAdmin hosting without persistent Node.js daemon processes.

---

## 📂 Core Business Modules

### 1. Executive Dashboard (`/`)
- Real-time liquidity summary across Cash in Hand, Bank, and Mobile Banking wallets (bKash / Nagad / Rocket).
- Total Receivables vs. Total Payables overview.
- Net Cash Flow metrics and Recent Invoices table.

### 2. Contacts & CRM (`/contacts`)
- Customer and Vendor directories with active/inactive filtering.
- **Opening Balance Setup**: Specify opening balance, direction (To Receive / To Pay), and as-of date; automatically writes balanced entries to Opening Balance Equity without duplicate entries.
- **Interactive Statement & Party Ledger**: View comprehensive chronological transaction history and running balances.
- 1-click WhatsApp messaging (`wa.me`) integration.

### 3. Items & Inventory Catalog (`/items`)
- **Dynamic Categorization**: Group items by custom categories (e.g. Hardware, Software, Services, Raw Materials) rather than rigid types.
- **Filtering & Sorting**: Filter items by category; sort by category, name, or sales price.
- **Opt-in Stock Tracking**: Hide or display stock levels based on organization preferences in Settings.
- **Item Deletion**: Direct item delete action with relational foreign key protection (`nullOnDelete`).
- **Quick Sell POS**: Instant counter sale modal supporting **Walk-in Customer** (no phone required) as well as existing registered customers from the directory, automatically creating confirmed paid invoices and decrementing stock.

### 4. Sales Module
- **Bookings & Quotes (`/sales/bookings`)**: Service bookings, advance customer deposits, and 1-click conversion to invoices.
- **Invoices & Sales (`/sales/invoices`)**: Invoice creation with itemized line items, discounts, shipping charges, adjustments, and upfront deposit tracking.
- **Payments Received (`/sales/payments-received`)**: Record customer receipts with interactive Invoice details popups and inline payment recording.

### 5. Purchases Module
- **Bills & Purchases (`/purchases/bills`)**: Accounts payable bills, vendor invoices, due date tracking, and partial payments.
- **Operating Expenses (`/purchases/expenses`)**: Record operational expenses with dynamic categories managed in Settings and paid-through account selection.
- **Payments Made (`/purchases/payments-made`)**: Record vendor payments with interactive Bill details popups and inline settlement.

### 6. Reports Center (`/reports`)
A comprehensive, Zoho Books-inspired central reporting hub:
- **Left Sidebar Navigation**: Fast switching between *All Reports*, *Favorites (Starred)*, and 7 functional categories.
- **Live Search**: Instant client-side filtering across report names and descriptions.
- **Interactive Links**: Click customer or vendor names to jump directly to their real-time Party Ledger statement.
- **21 Real-Time Financial Reports**:
  - **Business Overview**: Profit and Loss, Balance Sheet, Cash Flow Statement.
  - **Sales**: Sales Summary, Sales by Customer, Sales by Item.
  - **Receivables**: Customer Balance Summary, Customer Statement / Party Ledger, Order Details, AR Aging Summary, Invoice Details, Receivable Summary.
  - **Payments Received**: Payments Received Summary.
  - **Payables**: Vendor Balance Summary, Vendor Statement / Party Ledger, AP Aging Summary, Bill Details, Payments Made, Payable Summary.
  - **Purchases & Expenses**: Purchases by Vendor, Purchases by Item, Expense Details, Expenses by Category.
  - **Accountant**: Trial Balance, General Ledger, Journal Report.

### 7. Banking & General Ledger (`/banking`)
- Real-time running balances for all cash, bank, and mobile financial accounts.
- Manual Journal Entry form with strict multi-line Debit = Credit balance enforcement.

### 8. Settings & Setup (`/settings`)
- **My Profile**: Update administrator name, email, and password.
- **Business Info**: Company name, address, BIN/Tax number, and WhatsApp Cloud API credentials.
- **Chart of Accounts**: Create and edit ledger account codes, types, and running balances.
- **Categories & Stock**:
  - Inventory & Stock Tracking feature toggle (opt-in).
  - Item & Inventory Categories management (Add, Edit, Delete).
  - Operating Expense Categories management (Add, Edit, Delete).
- **Currency Setup**: Set currency symbol (`৳`) and code (`BDT`).
- **User Approvals**: Admin control to approve/reject user registrations and toggle roles.

---

## 💻 Local Development Setup

### Prerequisites
- **PHP 8.2+** (with extensions: `bcmath`, `pdo_mysql` / `pdo_sqlite`, `mbstring`, `openssl`, `curl`)
- **Composer** (v2.x)
- **Node.js** (v18+) & **npm**

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/NayeemIbrahim/Nefco-Books.git
   cd Nefco-Books
   ```

2. **Install PHP dependencies**:
   ```bash
   composer install
   ```

3. **Install JavaScript dependencies & build assets**:
   ```bash
   npm install
   npm run build
   ```

4. **Configure Environment**:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   *Configure your `DB_CONNECTION`, `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` in `.env`.*

5. **Run Migrations & Seeders**:
   ```bash
   php artisan migrate --seed
   ```

6. **Start Development Server**:
   ```bash
   php artisan serve
   ```
   Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

---

## 🧪 Automated Testing

Nefco Books includes a comprehensive automated test suite verifying double-entry posting, invoice settlements, reports center, and quick sales:

```bash
php artisan test
```

All 29 feature and unit tests pass with 205 assertions.

---

## 🌐 Live Server Deployment (DirectAdmin / cPanel)

1. **Document Root**:
   - Point your domain or subdomain to the `public/` directory of the application.
2. **Environment File**:
   - Copy `.env.example` to `.env` and set `APP_ENV=production`, `APP_DEBUG=false`, and `APP_URL=https://your-domain.com`.
   - Configure MySQL credentials.
3. **Database Migration**:
   ```bash
   php artisan migrate --seed --force
   ```
4. **File Permissions**:
   ```bash
   chmod -R 775 storage bootstrap/cache
   ```
5. **Pre-compiled Assets**:
   - Production Vite bundles are tracked in `public/build/`, ensuring zero build overhead or Node daemon requirements on shared hosts.

---

## 📄 License
This software is developed for business management. All rights reserved.
