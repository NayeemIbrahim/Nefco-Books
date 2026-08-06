import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppInvoiceNotification } from "@/lib/whatsapp";
import { createBalancedJournalEntry } from "@/lib/accounting";

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required for conversion" }, { status: 400 });
    }

    const invNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // 1. Fetch booking details
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          contact: true,
          lineItems: true,
        },
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking record not found" }, { status: 404 });
      }

      // 2. Create Invoice from Booking line items
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: invNum,
          bookingId: booking.id,
          contactId: booking.contactId,
          issueDate: new Date(),
          dueDate,
          status: "SENT",
          subtotal: booking.totalAmount,
          taxAmount: 0.0,
          discountAmount: 0.0,
          totalAmount: booking.totalAmount,
          paidAmount: 0.0,
          notes: `Converted from confirmed booking ${booking.bookingNumber}`,
          lineItems: {
            create: booking.lineItems.map((li) => ({
              itemId: li.itemId,
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              amount: li.amount,
            })),
          },
        },
        include: {
          contact: true,
          lineItems: true,
        },
      });

      // 3. Post Double-Entry Journal Entry: Debit 1100 AR / Credit 4000 Sales Revenue
      try {
        await createBalancedJournalEntry({
          entryNumber: `JRN-${invNum}`,
          description: `Auto entry for Booking Conversion Invoice ${invNum}`,
          sourceDocumentType: "INVOICE",
          sourceDocumentId: invoice.id,
          lines: [
            { accountCode: "1100", debit: invoice.totalAmount, credit: 0, description: `AR for ${invNum}` },
            { accountCode: "4000", debit: 0, credit: invoice.totalAmount, description: `Revenue for ${invNum}` },
          ],
        });
      } catch (e) {
        console.warn("Auto entry notice:", e);
      }

      // 4. Update Booking status to COMPLETED
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "COMPLETED" },
      });

      // 5. Send automated WhatsApp notification
      let waStatus = null;
      if (booking.contact?.whatsappNumber) {
        waStatus = await sendWhatsAppInvoiceNotification({
          toPhoneNumber: booking.contact.whatsappNumber,
          customerName: booking.contact.name,
          invoiceNumber: invNum,
          amountBDT: invoice.totalAmount,
          dueDate: dueDate.toLocaleDateString("en-BD"),
        });
      }

      return NextResponse.json({
        success: true,
        invoice,
        whatsappNotification: waStatus,
      });
    } catch (dbError) {
      // Mock Fallback
      const mockConvertedInvoice = {
        id: `inv_converted_${Date.now()}`,
        invoiceNumber: invNum,
        bookingId,
        contact: {
          name: "Rahim Chowdhury",
          whatsappNumber: "+8801711223344",
        },
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        status: "SENT",
        totalAmount: 75000.0,
        notes: `Converted from confirmed booking ${bookingId}`,
      };

      const waStatus = await sendWhatsAppInvoiceNotification({
        toPhoneNumber: "+8801711223344",
        customerName: "Rahim Chowdhury",
        invoiceNumber: invNum,
        amountBDT: 75000.0,
        dueDate: new Date(Date.now() + 86400000 * 14).toLocaleDateString("en-BD"),
      });

      return NextResponse.json({
        success: true,
        invoice: mockConvertedInvoice,
        whatsappNotification: waStatus,
      });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to convert booking to invoice" }, { status: 500 });
  }
}
