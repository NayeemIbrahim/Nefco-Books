# Changelog - Nefco Books

All notable changes to **Nefco Books** (Cloud Accounting & Business Management Application) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.1] - 2026-09-17

### Added
- **DirectAdmin Production Server Entry Point**: Created `server.js` Node.js HTTP server wrapper for Next.js 14 for compatibility with Phusion Passenger / DirectAdmin Node.js App Selector on `https://app.nefconit.com/`.

### Changed
- **Package Startup Script**: Updated `"start"` command in `package.json` to `node server.js`.

---

## [1.1.0] - 2026-09-11

### Changed
- **Database Architecture Migration**: Migrated Prisma ORM provider from PostgreSQL to **MySQL** for full compatibility with DirectAdmin live web hosting environments.
- **Environment & Setup Configurations**: Updated `.env` and `.env.example` connection strings to MySQL format (`mysql://username:password@localhost:3306/dbname`).
- **Documentation**: Updated `README.md` database badges and prerequisites.

---

## [1.0.0] - 2026-08-06

### Added
- **Single Currency Engine**: Standardized all accounting, catalog items, invoices, bills, and financial statements strictly in **Bangladeshi Taka (BDT `৳`)**.
- **Double-Entry Ledger Architecture**:
  - Pre-seeded Chart of Accounts (`Account` model with 1000 Petty Cash, 1010 Main Bank BDT, 1020 Mobile Banking, 1100 Accounts Receivable, 2000 Accounts Payable, 3000 Owner's Equity, 4000 Sales Revenue, 5000 COGS, 6000 Expenses).
  - Automatic double-entry journal entry generation (`Debit 1100 AR` / `Credit 4000 Revenue`) upon invoice confirmation.
  - Balanced transaction validator in `lib/accounting.ts` enforcing `sum(Debit) === sum(Credit)`.
- **CRM & Contacts Management**:
  - Customer & Vendor directory with search, filter tabs (`CUSTOMER`, `VENDOR`, `BOTH`), and balance tracking (`currentBalance`).
  - Mandatory `whatsappNumber` tracking with one-click direct `wa.me` WhatsApp web chat buttons.
  - Zoho Books style slide-out form drawers for contact creation.
- **Items & Inventory Catalog**:
  - Goods vs Services catalog with SKU, custom unit of measure, BDT sales & purchase price management, and stock quantity tracking.
- **Order & Booking Pipeline**:
  - Booking pipeline tracking with status badges (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
  - Dynamic multi-line items builder with total amount calculation in BDT.
  - **1-Click Booking-to-Invoice Conversion**: Action button to instantly generate pre-filled sales invoices from confirmed bookings.
- **Sales Invoicing & Meta WhatsApp Integration**:
  - Rich invoice management with real-time status badges (`DRAFT`, `SENT`, `PAID`, `OVERDUE`).
  - Line items builder with Tax and Discount calculations in BDT (`৳`).
  - Printable/PDF Zoho Books inspired invoice template.
  - Meta WhatsApp Cloud API helper (`lib/whatsapp.ts`) sending automated WhatsApp notifications on invoice issuance and payment receipts.
  - One-click manual "Send WhatsApp Alert" buttons on invoices.
- **Executive Financial Statements**:
  - **Profit & Loss Statement**: Real-time Operating Revenue minus COGS & Expenses.
  - **Balance Sheet Statement**: Verifies `Assets = Liabilities + Owner's Equity`.
  - **Trial Balance Report**: Validates total debit and credit equilibrium across all Chart of Accounts.
- **Zoho Books Inspired Design**:
  - Dark slate navigation sidebar with logo badge (`NB`), top search header, currency status pill, and responsive desktop layout built using Next.js App Router, Tailwind CSS, and Shadcn UI.
