# Nefco Books 📚

> **Cloud Accounting & Business Management Application for Bangladeshi Businesses**  
> Inspired by the desktop aesthetic of **Zoho Books**, powered by **Laravel 11**, **Inertia.js (React)**, and **MySQL**, adhering strictly to double-entry accounting standards in **BDT (৳)**.

---

## 🚀 Key Highlights & Tech Stack

- **Backend**: Laravel 11 (PHP 8.2+) with Eloquent ORM.
- **Frontend**: Inertia.js with React 18, Tailwind CSS, Lucide Icons, and Vite.
- **Database**: MySQL (Production) / SQLite (Local dev option).
- **Accounting Engine**: Strict Double-Entry Ledger with `bcmath` balance verification, atomic database transactions (`DB::transaction`), and running balance updates.
- **Communications**: Meta WhatsApp Cloud API integration for automated invoice and payment dispatch.
- **Hosting Native**: Native PHP execution on DirectAdmin / cPanel / Apache / LiteSpeed, avoiding Node.js Passenger memory limits.

---

## 📂 Core Business Modules

1. **Executive Dashboard**: Real-time liquidity summary (Cash, Bank, bKash), Receivables vs. Payables, Net Cash Flow, and Recent Invoices.
2. **Contacts & CRM**: Customer and Vendor directory, real-time balance tracking, and 1-click WhatsApp chat (`wa.me`).
3. **Products & Services Catalog**: SKU, unit measures, sales price, purchase cost, and inventory stock tracking in BDT.
4. **Bookings & Advance Orders**: Service appointments, advance deposits, and 1-click conversion to sales invoices.
5. **Sales & Invoices**: Invoice generation, itemized tax and discount computations, printable layout, and WhatsApp notification queue.
6. **Purchases & Vendor Bills**: Accounts payable tracking, vendor bills, and expense reconciliation.
7. **Cash, Banking & General Journal**: Bank account balances and balanced manual journal entries (`Debit = Credit`).
8. **Financial Statements**:
   - **Profit & Loss**: Operating Revenue minus COGS and Operating Expenses.
   - **Balance Sheet**: Assets = Liabilities + Equity validation.
   - **Trial Balance**: Complete general ledger equilibrium verification.

---

## 💻 Local Development Setup

### Prerequisites
- **PHP 8.2+** (with `bcmath`, `pdo_mysql` / `pdo_sqlite`, `mbstring`, `openssl`, `curl`)
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

6. **Start Local Development Server**:
   ```bash
   php artisan serve
   ```
   Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

---

## 🌐 Live Server Deployment (DirectAdmin / cPanel)

Because Nefco Books is powered by **Laravel 11**, deployment on shared hosting (such as DirectAdmin at `https://app.nefconit.com/`) is seamless:

1. **Point Web Root to `/public`**:
   - In DirectAdmin / cPanel, set the domain's document root (or create a symbolic link) to the `public/` directory of this project.
2. **Environment Configuration**:
   - Copy `.env.example` to `.env`.
   - Set `APP_ENV=production`, `APP_DEBUG=false`, and `APP_URL=https://app.nefconit.com`.
   - Fill in your live MySQL database credentials.
   - Run `php artisan key:generate`.
3. **Database Migration**:
   - Run `php artisan migrate --seed --force` to create the tables and seed the Chart of Accounts.
4. **Permissions**:
   - Ensure `storage/` and `bootstrap/cache/` directories are writable by the web server (`chmod -R 775 storage bootstrap/cache`).
5. **No Node Daemon Required**:
   - Frontend Vite assets are pre-compiled and tracked in `public/build/`, requiring zero Node.js daemon processes or RAM overhead on the server!

---

## 📄 License
This project is proprietary and confidential to **Nefco Books**.
