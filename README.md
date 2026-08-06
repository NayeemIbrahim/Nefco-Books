# Nefco Books - Cloud Accounting & Business Management Application

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](CHANGELOG.md)
[![Framework](https://img.shields.io/badge/Next.js-14%20App%20Router-black.svg)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Prisma-PostgreSQL-indigo.svg)](https://www.prisma.io/)

**Nefco Books** is a comprehensive Cloud Accounting and Business Management Application.

---

## Key Features

- 💼 **Double-Entry Accounting Ledger**: Full Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expense) with automated balanced journal entry posting (`Debit === Credit`).
- 📱 **CRM & WhatsApp Automation**: Customer/Vendor management with mandatory WhatsApp fields, direct `wa.me` chat links, and automated WhatsApp notifications (via Meta Cloud API) when invoices are generated or payments are received.
- 📦 **Items & Inventory Management**: Goods vs Services tracking, SKU codes, custom units of measure, and BDT purchase/sales price management.
- 📅 **Order/Booking Pipeline**: Status tracking (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`) with **1-Click Conversion** of confirmed bookings into draft/sent invoices.
- 📄 **Sales Invoicing & Receipts**: Printable/PDF invoices with tax & discount breakdowns in BDT (`৳`).
- 📊 **Executive Financial Reports**: Real-time Profit & Loss Statement, Balance Sheet (`Assets = Liabilities + Equity`), and Trial Balance verification.
- 🎨 **Zoho Books Inspired UI**: Clean desktop software aesthetic built with Tailwind CSS, Shadcn UI primitives, slide-out drawer forms, and dense data tables.

---

## Tech Stack

- **Frontend & Backend**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + Shadcn UI (Lucide Icons, Radix UI)
- **Database & ORM**: PostgreSQL & Prisma ORM
- **Messaging**: Meta WhatsApp Cloud API (`lib/whatsapp.ts`)
- **Base Currency**: Bangladeshi Taka (`BDT / ৳`)

---

## Getting Started

### Prerequisites
- Node.js `v18.x` or higher (`v24.x` recommended)
- PostgreSQL Database server

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/nefco-books.git
   cd nefco-books
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```

   Ensure `.env` contains:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nefco_books_db?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-super-secret-key"
   WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
   WHATSAPP_ACCESS_TOKEN="your_access_token"
   NEXT_PUBLIC_APP_NAME="Nefco Books"
   NEXT_PUBLIC_CURRENCY_SYMBOL="৳"
   NEXT_PUBLIC_CURRENCY_CODE="BDT"
   ```

4. **Initialize Database & Prisma**:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run prisma:seed
   ```

5. **Run Development Server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Financial Reports & Double-Entry Mapping

| Transaction | Debit Account | Credit Account |
| :--- | :--- | :--- |
| **Invoice Confirmation** | `1100 Accounts Receivable` | `4000 Sales Revenue` |
| **Customer Payment Received** | `1000 Cash / 1010 Bank / 1020 bKash` | `1100 Accounts Receivable` |
| **Vendor Bill Received** | `6000 Expense / 5000 COGS` | `2000 Accounts Payable` |
| **Vendor Bill Paid** | `2000 Accounts Payable` | `1010 Bank Account` |

---

## License

Private / Proprietary software built for **Nefco Books**.
