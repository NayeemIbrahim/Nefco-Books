import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppInvoiceNotification } from "@/lib/whatsapp";
import { createBalancedJournalEntry } from "@/lib/accounting";

// Mock store for in-memory fallback
let mockInvoices = [
  {
    id: "inv_1",
    invoiceNumber: "INV-2026-0001",
    bookingId: "bkg_1",
    contactId: "cnt_1",
    contact: {
      id: "cnt_1",
      name: "Rahim Chowdhury",
      companyName: "Chowdhury Enterprise",
      whatsappNumber: "+8801711223344",
      email: "rahim@chowdhury.bd",
      address: "House 42, Road 11, Banani, Dhaka",
    },
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
    status: "SENT",
    subtotal: 75000.0,
    taxAmount: 0.0,
    discountAmount: 0.0,
    totalAmount: 75000.0,
    paidAmount: 0.0,
    notes: "Converted from Booking BKG-2026-0001. Web Application Development.",
    lineItems: [
      {
        id: "ili_1",
        description: "Web Application Development in Next.js & Tailwind CSS",
        quantity: 1,
        unitPrice: 75000.0,
        amount: 75000.0,
      },
    ],
    whatsappSent: true,
    createdAt: new Date().toISOString(),
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const status = searchParams.get("status");

    try {
      const where: any = {};
      if (status && status !== "ALL") {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { invoiceNumber: { contains: search, mode: "insensitive" } },
          { contact: { name: { contains: search, mode: "insensitive" } } },
        ];
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          contact: true,
          lineItems: true,
          booking: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(invoices);
    } catch (dbError) {
      let filtered = mockInvoices;
      if (status && status !== "ALL") {
        filtered = filtered.filter((i) => i.status === status);
      }
      if (search) {
        filtered = filtered.filter(
          (i) =>
            i.invoiceNumber.toLowerCase().includes(search) ||
            i.contact.name.toLowerCase().includes(search)
        );
      }
      return NextResponse.json(filtered);
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      contactId,
      contactName,
      whatsappNumber,
      bookingId,
      issueDate,
      dueDate,
      status = "SENT",
      lineItems = [],
      subtotal = 0,
      taxAmount = 0,
      discountAmount = 0,
      notes = "",
    } = body;

    const totalAmount = subtotal + taxAmount - discountAmount;
    const invNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    let newInvoice: any;

    try {
      // Create Invoice in DB
      newInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber: invNum,
          contactId,
          bookingId: bookingId || null,
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 86400000 * 14),
          status,
          subtotal: parseFloat(subtotal),
          taxAmount: parseFloat(taxAmount),
          discountAmount: parseFloat(discountAmount),
          totalAmount: parseFloat(totalAmount as any),
          paidAmount: 0.0,
          notes,
          lineItems: {
            create: lineItems.map((li: any) => ({
              itemId: li.itemId || null,
              description: li.description,
              quantity: parseFloat(li.quantity) || 1,
              unitPrice: parseFloat(li.unitPrice) || 0,
              amount: (parseFloat(li.quantity) || 1) * (parseFloat(li.unitPrice) || 0),
            })),
          },
        },
        include: {
          contact: true,
          lineItems: true,
        },
      });

      // Post Double-Entry Journal Entry
      // Debit: Accounts Receivable (1100) -> Total Amount
      // Credit: Sales Revenue (4000) -> Total Amount
      try {
        await createBalancedJournalEntry({
          entryNumber: `JRN-${invNum}`,
          description: `Auto journal for Invoice ${invNum}`,
          sourceDocumentType: "INVOICE",
          sourceDocumentId: newInvoice.id,
          lines: [
            { accountCode: "1100", debit: totalAmount, credit: 0, description: `AR for ${invNum}` },
            { accountCode: "4000", debit: 0, credit: totalAmount, description: `Sales revenue ${invNum}` },
          ],
        });
      } catch (e) {
        console.warn("Accounting double-entry post notice:", e);
      }

      // If booking was supplied, update booking status to COMPLETED
      if (bookingId) {
        try {
          await prisma.booking.update({
            where: { id: bookingId },
            data: { status: "COMPLETED" },
          });
        } catch (e) {}
      }
    } catch (dbError) {
      // Mock Fallback
      newInvoice = {
        id: `inv_${Date.now()}`,
        invoiceNumber: invNum,
        bookingId: bookingId || null,
        contactId: contactId || "cnt_1",
        contact: {
          id: contactId || "cnt_1",
          name: contactName || "Rahim Chowdhury",
          companyName: "Chowdhury Enterprise",
          whatsappNumber: whatsappNumber || "+8801711223344",
          email: "rahim@chowdhury.bd",
          address: "House 42, Road 11, Banani, Dhaka",
        },
        issueDate: issueDate || new Date().toISOString(),
        dueDate: dueDate || new Date(Date.now() + 86400000 * 14).toISOString(),
        status: status || "SENT",
        subtotal: parseFloat(subtotal),
        taxAmount: parseFloat(taxAmount),
        discountAmount: parseFloat(discountAmount),
        totalAmount: parseFloat(totalAmount as any),
        paidAmount: 0.0,
        notes: notes || "",
        lineItems: lineItems.map((li: any, idx: number) => ({
          id: `ili_${Date.now()}_${idx}`,
          description: li.description,
          quantity: parseFloat(li.quantity) || 1,
          unitPrice: parseFloat(li.unitPrice) || 0,
          amount: (parseFloat(li.quantity) || 1) * (parseFloat(li.unitPrice) || 0),
        })),
        whatsappSent: false,
        createdAt: new Date().toISOString(),
      };
      mockInvoices.unshift(newInvoice);
    }

    // WhatsApp Automated Notification Dispatch
    let whatsappResult = null;
    if (newInvoice.contact?.whatsappNumber) {
      whatsappResult = await sendWhatsAppInvoiceNotification({
        toPhoneNumber: newInvoice.contact.whatsappNumber,
        customerName: newInvoice.contact.name,
        invoiceNumber: newInvoice.invoiceNumber,
        amountBDT: newInvoice.totalAmount,
        dueDate: new Date(newInvoice.dueDate).toLocaleDateString("en-BD"),
      });
      newInvoice.whatsappSent = true;
    }

    return NextResponse.json(
      { invoice: newInvoice, whatsappNotification: whatsappResult },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
