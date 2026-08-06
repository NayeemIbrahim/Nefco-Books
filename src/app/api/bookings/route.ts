import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let mockBookings = [
  {
    id: "bkg_1",
    bookingNumber: "BKG-2026-0001",
    contactId: "cnt_1",
    contact: {
      id: "cnt_1",
      name: "Rahim Chowdhury",
      companyName: "Chowdhury Enterprise",
      whatsappNumber: "+8801711223344",
    },
    bookingDate: new Date().toISOString(),
    serviceDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    status: "CONFIRMED",
    notes: "Web app deployment and initial database migration setup.",
    totalAmount: 75000.0,
    lineItems: [
      {
        id: "bli_1",
        itemId: "itm_1",
        description: "Web Application Development",
        quantity: 1,
        unitPrice: 75000.0,
        amount: 75000.0,
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "bkg_2",
    bookingNumber: "BKG-2026-0002",
    contactId: "cnt_3",
    contact: {
      id: "cnt_3",
      name: "Bishwas Tech Solutions",
      companyName: "Bishwas Tech",
      whatsappNumber: "+8801912345678",
    },
    bookingDate: new Date().toISOString(),
    serviceDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    status: "PENDING",
    notes: "2x Monitors and Cloud Hosting consultation",
    totalAmount: 100000.0,
    lineItems: [
      {
        id: "bli_2",
        itemId: "itm_2",
        description: "Dell UltraSharp 27 Monitor",
        quantity: 2,
        unitPrice: 42500.0,
        amount: 85000.0,
      },
      {
        id: "bli_3",
        itemId: "itm_3",
        description: "SaaS Cloud Hosting Setup",
        quantity: 1,
        unitPrice: 15000.0,
        amount: 15000.0,
      },
    ],
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

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          contact: true,
          lineItems: {
            include: {
              item: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(bookings);
    } catch (dbError) {
      let filtered = mockBookings;
      if (status && status !== "ALL") {
        filtered = filtered.filter((b) => b.status === status);
      }
      if (search) {
        filtered = filtered.filter(
          (b) =>
            b.bookingNumber.toLowerCase().includes(search) ||
            b.contact.name.toLowerCase().includes(search) ||
            (b.contact.companyName && b.contact.companyName.toLowerCase().includes(search))
        );
      }
      return NextResponse.json(filtered);
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contactId, serviceDate, notes, lineItems, contactName, whatsappNumber } = body;

    if (!contactId && !contactName) {
      return NextResponse.json({ error: "Contact is required for booking" }, { status: 400 });
    }

    const calculatedTotal = (lineItems || []).reduce(
      (acc: number, item: any) => acc + (parseFloat(item.quantity || 1) * parseFloat(item.unitPrice || 0)),
      0
    );

    const bookingNum = `BKG-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const booking = await prisma.booking.create({
        data: {
          bookingNumber: bookingNum,
          contactId,
          serviceDate: serviceDate ? new Date(serviceDate) : null,
          status: "PENDING",
          notes: notes || null,
          totalAmount: calculatedTotal,
          lineItems: {
            create: (lineItems || []).map((li: any) => ({
              itemId: li.itemId || null,
              description: li.description || "Service/Item",
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

      return NextResponse.json(booking, { status: 201 });
    } catch (dbError) {
      const newBooking = {
        id: `bkg_${Date.now()}`,
        bookingNumber: bookingNum,
        contactId: contactId || "cnt_1",
        contact: {
          id: contactId || "cnt_1",
          name: contactName || "Rahim Chowdhury",
          companyName: "Chowdhury Enterprise",
          whatsappNumber: whatsappNumber || "+8801711223344",
        },
        bookingDate: new Date().toISOString(),
        serviceDate: serviceDate || new Date().toISOString(),
        status: "PENDING",
        notes: notes || "",
        totalAmount: calculatedTotal,
        lineItems: (lineItems || []).map((li: any, idx: number) => ({
          id: `bli_${Date.now()}_${idx}`,
          itemId: li.itemId || null,
          description: li.description || "Service/Item",
          quantity: parseFloat(li.quantity) || 1,
          unitPrice: parseFloat(li.unitPrice) || 0,
          amount: (parseFloat(li.quantity) || 1) * (parseFloat(li.unitPrice) || 0),
        })),
        createdAt: new Date().toISOString(),
      };
      mockBookings.unshift(newBooking);
      return NextResponse.json(newBooking, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
