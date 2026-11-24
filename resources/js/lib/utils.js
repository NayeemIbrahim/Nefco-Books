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
 * Formats product items, quantities, prices, previous due, and current invoice due,
 * using the company name and custom message template configured in Settings.
 */
export function getWhatsAppShareUrl(doc, options = {}) {
  if (!doc) return "#";

  // Support legacy parameter passing: getWhatsAppShareUrl(invoice, companyNameString)
  const config = typeof options === "string" ? { companyName: options } : (options || {});
  const companyName = config.companyName || config.company?.company_name || config.company?.name || "Our Company";
  const customTemplate = config.template || config.company?.whatsapp_template || "";

  const isBill = Boolean(config.isBill || doc.bill_number);
  const docType = isBill ? "Bill" : "Invoice";
  const docNumber = doc.invoice_number || doc.bill_number || docType;
  const customerName = doc.contact?.name || (isBill ? "Valued Vendor" : "Valued Customer");

  const rawPhone = doc.contact?.whatsapp_number || doc.contact?.phone || "";
  let cleanPhone = rawPhone.replace(/\D/g, "");
  if (cleanPhone.startsWith("01") && cleanPhone.length === 11) {
    cleanPhone = "88" + cleanPhone;
  }

  const totalNum = parseFloat(doc.total_amount) || 0;
  const paidNum = parseFloat(doc.paid_amount) || 0;
  const dueNum = Math.max(0, totalNum - paidNum);
  const prevDueNum = Math.max(0, parseFloat(doc.previous_due) || 0);
  const grandTotalDueNum = dueNum + prevDueNum;

  const totalStr = totalNum.toLocaleString("en-BD", { minimumFractionDigits: 2 });
  const paidStr = paidNum.toLocaleString("en-BD", { minimumFractionDigits: 2 });
  const dueStr = dueNum.toLocaleString("en-BD", { minimumFractionDigits: 2 });
  const prevDueStr = prevDueNum.toLocaleString("en-BD", { minimumFractionDigits: 2 });
  const grandTotalDueStr = grandTotalDueNum.toLocaleString("en-BD", { minimumFractionDigits: 2 });
  const statusStr = doc.status || "UNPAID";

  // Format line items
  const lineItems = doc.line_items || doc.lineItems || [];
  let itemsFormatted = "";
  if (Array.isArray(lineItems) && lineItems.length > 0) {
    itemsFormatted = lineItems
      .map((item, idx) => {
        const name = item.item?.name || item.description || `Item #${idx + 1}`;
        const qty = parseFloat(item.quantity) || 1;
        const price = Number(item.unit_price || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
        const subtotal = Number(item.amount || (qty * (parseFloat(item.unit_price) || 0))).toLocaleString("en-BD", { minimumFractionDigits: 2 });
        return `${idx + 1}. ${name} (${qty} × ৳${price}) = ৳${subtotal}`;
      })
      .join("\n");
  } else {
    itemsFormatted = `• General ${docType} Services: ৳${totalStr}`;
  }

  let message = "";

  if (customTemplate && customTemplate.trim()) {
    message = customTemplate
      .replaceAll("{company_name}", companyName)
      .replaceAll("{customer_name}", customerName)
      .replaceAll("{invoice_number}", docNumber)
      .replaceAll("{bill_number}", docNumber)
      .replaceAll("{items}", itemsFormatted)
      .replaceAll("{total_amount}", totalStr)
      .replaceAll("{paid_amount}", paidStr)
      .replaceAll("{due_amount}", dueStr)
      .replaceAll("{previous_due}", prevDueStr)
      .replaceAll("{grand_total_due}", grandTotalDueStr)
      .replaceAll("{status}", statusStr);
  } else {
    message = `*${companyName}*\n` +
      `*${docType} #${docNumber}*\n\n` +
      `Dear ${customerName},\n` +
      `Thank you for doing business with ${companyName}. Here is the breakdown of your ${docType.toLowerCase()}:\n\n` +
      `*Items Purchased:*\n` +
      `${itemsFormatted}\n\n` +
      `*Payment & Due Summary:*\n` +
      `• ${docType} Total: ৳${totalStr}\n` +
      `• Amount Paid: ৳${paidStr}\n` +
      `• ${docType} Due: ৳${dueStr}\n` +
      `• Previous Due: ৳${prevDueStr}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `*Total Outstanding Due: ৳${grandTotalDueStr}*\n\n` +
      `For any inquiries, please contact us.\n` +
      `_${companyName}_`;
  }

  const encoded = encodeURIComponent(message);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
