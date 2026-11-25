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
  const isBill = Boolean(config.isBill || doc.bill_number);
  const customTemplate =
    config.template ||
    (isBill ? config.company?.whatsapp_bill_template : config.company?.whatsapp_template) ||
    "";

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

/**
 * Generate a direct WhatsApp URL for a Payment Receipt (Customer) or Payment Made (Vendor),
 * including payment date, amount, reference, allocated invoices/bill, and current due if due > 0.
 */
export function getPaymentWhatsAppShareUrl(payment, options = {}) {
  if (!payment) return "#";

  const config = options || {};
  const companyName = config.companyName || config.company?.company_name || config.company?.name || "Our Company";
  const isVendorPayment = Boolean(config.isVendor || payment.type === "VENDOR_PAYMENT");

  const customTemplate =
    config.template ||
    (isVendorPayment
      ? config.company?.whatsapp_payment_made_template
      : config.company?.whatsapp_receipt_template) ||
    "";

  const contactName = payment.contact?.name || (isVendorPayment ? "Valued Vendor" : "Valued Customer");
  const rawPhone = payment.contact?.whatsapp_number || payment.contact?.phone || "";
  let cleanPhone = rawPhone.replace(/\D/g, "");
  if (cleanPhone.startsWith("01") && cleanPhone.length === 11) {
    cleanPhone = "88" + cleanPhone;
  }

  const payNumber = payment.payment_number || "Receipt";
  const payDate = formatDate(payment.payment_date);
  const amountNum = parseFloat(payment.amount) || 0;
  const amountStr = amountNum.toLocaleString("en-BD", { minimumFractionDigits: 2 });
  const methodStr = (payment.payment_method || "CASH").replace("_", " ");
  const refStr = payment.reference_number || "N/A";

  const currentDueNum = Math.max(0, parseFloat(payment.contact?.current_balance) || 0);
  const currentDueStr = currentDueNum.toLocaleString("en-BD", { minimumFractionDigits: 2 });

  // Format allocated invoices or bill
  let allocatedDocsStr = "";
  if (isVendorPayment) {
    allocatedDocsStr = payment.bill?.bill_number ? `Bill #${payment.bill.bill_number}` : "Direct Vendor Payment";
  } else if (Array.isArray(payment.allocations) && payment.allocations.length > 0) {
    allocatedDocsStr = payment.allocations
      .map((al) => {
        const invNum = al.invoice?.invoice_number || `INV-${al.invoice_id}`;
        const amt = Number(al.amount || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
        return `${invNum} (৳${amt})`;
      })
      .join(", ");
  } else if (payment.invoice?.invoice_number) {
    allocatedDocsStr = payment.invoice.invoice_number;
  } else {
    allocatedDocsStr = "Unallocated / Account Payment";
  }

  let message = "";
  if (customTemplate && customTemplate.trim()) {
    const dueLine = currentDueNum > 0 ? `৳${currentDueStr}` : "৳0.00 (Settled)";
    message = customTemplate
      .replaceAll("{company_name}", companyName)
      .replaceAll("{customer_name}", contactName)
      .replaceAll("{vendor_name}", contactName)
      .replaceAll("{payment_number}", payNumber)
      .replaceAll("{payment_date}", payDate)
      .replaceAll("{amount}", amountStr)
      .replaceAll("{payment_method}", methodStr)
      .replaceAll("{reference_number}", refStr)
      .replaceAll("{allocated_invoices}", allocatedDocsStr)
      .replaceAll("{bill_number}", allocatedDocsStr)
      .replaceAll("{current_due}", dueLine);
  } else if (isVendorPayment) {
    message = `*${companyName}*\n` +
      `*Payment Voucher #${payNumber}*\n\n` +
      `Dear ${contactName},\n` +
      `We have made a payment to your account:\n\n` +
      `• Payment Date: ${payDate}\n` +
      `• Amount Paid: ৳${amountStr}\n` +
      `• Method: ${methodStr}\n` +
      (payment.reference_number ? `• Reference #: ${refStr}\n` : "") +
      `• Against: ${allocatedDocsStr}\n` +
      (currentDueNum > 0 ? `━━━━━━━━━━━━━━━━━━\n*Remaining Payable Due: ৳${currentDueStr}*\n` : "") +
      `\nThank you!\n_${companyName}_`;
  } else {
    message = `*${companyName}*\n` +
      `*Payment Receipt #${payNumber}*\n\n` +
      `Dear ${contactName},\n` +
      `Thank you! We have received your payment:\n\n` +
      `• Payment Date: ${payDate}\n` +
      `• Amount Received: ৳${amountStr}\n` +
      `• Method: ${methodStr}\n` +
      (payment.reference_number ? `• Reference #: ${refStr}\n` : "") +
      `• Applied To: ${allocatedDocsStr}\n` +
      (currentDueNum > 0 ? `━━━━━━━━━━━━━━━━━━\n*Current Due Balance: ৳${currentDueStr}*\n` : "") +
      `\nThank you for your business!\n_${companyName}_`;
  }

  const encodedText = encodeURIComponent(message);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
}
