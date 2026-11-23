import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatBDT(amount) {
  try {
    const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
    const validNum = isNaN(num) ? 0 : num;
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(validNum)
      .replace("BDT", "৳");
  } catch (e) {
    const n = parseFloat(amount) || 0;
    return `৳${n.toFixed(2)}`;
  }
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function formatDate(dateVal) {
  if (!dateVal) return "N/A";

  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    // 1. Matches "YYYY-MM-DD", "YYYY/MM/DD", or ISO strings like "2026-11-19T00:00:00..."
    const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const monthIdx = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${MONTH_NAMES[monthIdx]} ${year}`;
      }
    }

    // 2. Matches "DD-MM-YYYY" or "DD/MM/YYYY"
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const monthIdx = parseInt(dmyMatch[2], 10) - 1;
      const year = dmyMatch[3];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${MONTH_NAMES[monthIdx]} ${year}`;
      }
    }
  }

  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return "N/A";

  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Generate a direct WhatsApp Action URL to open WhatsApp Web or the WhatsApp Business app.
 * Opens directly to the selected customer's phone number with a pre-filled invoice message.
 */
export function getWhatsAppShareUrl(invoice, companyName = "Nefco Books") {
  if (!invoice) return "#";
  const rawPhone = invoice.contact?.whatsapp_number || invoice.contact?.phone || "";
  let cleanPhone = rawPhone.replace(/\D/g, "");
  if (cleanPhone.startsWith("01") && cleanPhone.length === 11) {
    cleanPhone = "88" + cleanPhone;
  }

  const customerName = invoice.contact?.name || "Valued Customer";
  const invNumber = invoice.invoice_number || "Invoice";
  const total = Number(invoice.total_amount || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
  const paid = Number(invoice.paid_amount || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
  const due = Number(Math.max(0, (invoice.total_amount || 0) - (invoice.paid_amount || 0))).toLocaleString("en-BD", { minimumFractionDigits: 2 });
  const status = invoice.status || "UNPAID";

  const message = `*Invoice #${invNumber}*\n` +
    `Dear ${customerName},\n` +
    `Thank you for doing business with ${companyName}.\n\n` +
    `*Invoice Details:*\n` +
    `• Total Amount: ৳${total}\n` +
    `• Amount Paid: ৳${paid}\n` +
    `• Balance Due: ৳${due}\n` +
    `• Status: ${status}\n\n` +
    `For any inquiries, please contact us.\n` +
    `_${companyName}_`;

  const encoded = encodeURIComponent(message);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
