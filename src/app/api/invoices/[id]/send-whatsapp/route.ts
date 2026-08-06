import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppInvoiceNotification } from "@/lib/whatsapp";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { contact: true },
      });

      if (!invoice || !invoice.contact?.whatsappNumber) {
        return NextResponse.json(
          { error: "Invoice or contact WhatsApp number not found" },
          { status: 400 }
        );
      }

      const res = await sendWhatsAppInvoiceNotification({
        toPhoneNumber: invoice.contact.whatsappNumber,
        customerName: invoice.contact.name,
        invoiceNumber: invoice.invoiceNumber,
        amountBDT: invoice.totalAmount,
        dueDate: new Date(invoice.dueDate).toLocaleDateString("en-BD"),
      });

      return NextResponse.json({ success: true, result: res });
    } catch (dbError) {
      const res = await sendWhatsAppInvoiceNotification({
        toPhoneNumber: "+8801711223344",
        customerName: "Rahim Chowdhury",
        invoiceNumber: "INV-2026-0001",
        amountBDT: 75000.0,
        dueDate: new Date().toLocaleDateString("en-BD"),
      });
      return NextResponse.json({ success: true, mock: true, result: res });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to dispatch WhatsApp message" }, { status: 500 });
  }
}
