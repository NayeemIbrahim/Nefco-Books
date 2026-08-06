/**
 * WhatsApp Cloud API Utility Helper
 * Encapsulates sending invoice and payment notifications via Meta's Graph API
 */

export interface WhatsAppInvoiceMessagePayload {
  toPhoneNumber: string;
  customerName: string;
  invoiceNumber: string;
  amountBDT: number;
  dueDate: string;
  invoiceUrl?: string;
}

export interface WhatsAppPaymentMessagePayload {
  toPhoneNumber: string;
  customerName: string;
  receiptNumber: string;
  paidAmountBDT: number;
  invoiceNumber: string;
  paymentDate: string;
}

export async function sendWhatsAppInvoiceNotification(payload: WhatsAppInvoiceMessagePayload) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  // Clean phone number (ensure country code e.g. +88017... -> 88017...)
  const formattedPhone = payload.toPhoneNumber.replace(/\D/g, "");

  const bodyText = `Dear ${payload.customerName},\n\nInvoice *${payload.invoiceNumber}* has been issued for your order from *Nefco Books*.\n\n*Total Amount:* ৳ ${payload.amountBDT.toLocaleString("en-BD", { minimumFractionDigits: 2 })}\n*Due Date:* ${payload.dueDate}\n\nThank you for doing business with Nefco Books!`;

  if (!phoneNumberId || !accessToken || accessToken.startsWith("mock_")) {
    console.log("[WhatsApp Mock Dispatch - Invoice Issued]:", {
      to: formattedPhone,
      message: bodyText,
    });
    return { success: true, mock: true, recipient: formattedPhone };
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "text",
        text: { body: bodyText },
      }),
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error("Failed to send WhatsApp Invoice notification:", error);
    return { success: false, error };
  }
}

export async function sendWhatsAppPaymentNotification(payload: WhatsAppPaymentMessagePayload) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  const formattedPhone = payload.toPhoneNumber.replace(/\D/g, "");

  const bodyText = `Dear ${payload.customerName},\n\nPayment Receipt *${payload.receiptNumber}* confirmed by *Nefco Books*!\n\n*Amount Paid:* ৳ ${payload.paidAmountBDT.toLocaleString("en-BD", { minimumFractionDigits: 2 })}\n*For Invoice:* ${payload.invoiceNumber}\n*Date:* ${payload.paymentDate}\n\nThank you for choosing Nefco Books!`;

  if (!phoneNumberId || !accessToken || accessToken.startsWith("mock_")) {
    console.log("[WhatsApp Mock Dispatch - Payment Received]:", {
      to: formattedPhone,
      message: bodyText,
    });
    return { success: true, mock: true, recipient: formattedPhone };
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "text",
        text: { body: bodyText },
      }),
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error("Failed to send WhatsApp Payment notification:", error);
    return { success: false, error };
  }
}
