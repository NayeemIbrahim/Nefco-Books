import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Mock in-memory store for fallback if DB is not connected locally
let mockContacts = [
  {
    id: "cnt_1",
    name: "Rahim Chowdhury",
    companyName: "Chowdhury Enterprise",
    email: "rahim@chowdhury.bd",
    phone: "+8801711223344",
    whatsappNumber: "+8801711223344",
    type: "CUSTOMER",
    address: "House 42, Road 11, Banani",
    city: "Dhaka",
    country: "Bangladesh",
    openingBalance: 0.0,
    currentBalance: 15400.0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cnt_2",
    name: "Karim Stationers & Supplies",
    companyName: "Karim Ltd",
    email: "sales@karimsupplies.com",
    phone: "+8801819001122",
    whatsappNumber: "+8801819001122",
    type: "VENDOR",
    address: "12 Motijheel C/A",
    city: "Dhaka",
    country: "Bangladesh",
    openingBalance: 0.0,
    currentBalance: -8500.0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cnt_3",
    name: "Bishwas Tech Solutions",
    companyName: "Bishwas Tech",
    email: "info@bishwastech.bd",
    phone: "+8801912345678",
    whatsappNumber: "+8801912345678",
    type: "BOTH",
    address: "Level 4, Software Technology Park, Kawran Bazar",
    city: "Dhaka",
    country: "Bangladesh",
    openingBalance: 0.0,
    currentBalance: 32000.0,
    createdAt: new Date().toISOString(),
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const type = searchParams.get("type");

    try {
      const where: any = {};
      if (type && type !== "ALL") {
        where.type = type;
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { companyName: { contains: search, mode: "insensitive" } },
          { whatsappNumber: { contains: search } },
        ];
      }

      const contacts = await prisma.contact.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(contacts);
    } catch (dbError) {
      // Fallback to mock data if PostgreSQL database is not connected
      console.warn("DB connection unavailable, returning mock contacts data:", dbError);
      let filtered = mockContacts;
      if (type && type !== "ALL") {
        filtered = filtered.filter((c) => c.type === type || c.type === "BOTH");
      }
      if (search) {
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(search) ||
            (c.companyName && c.companyName.toLowerCase().includes(search)) ||
            c.whatsappNumber.includes(search)
        );
      }
      return NextResponse.json(filtered);
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, companyName, email, phone, whatsappNumber, type, address, city, taxNumber } = body;

    if (!name || !whatsappNumber) {
      return NextResponse.json(
        { error: "Name and WhatsApp Number are required" },
        { status: 400 }
      );
    }

    try {
      const contact = await prisma.contact.create({
        data: {
          name,
          companyName: companyName || null,
          email: email || null,
          phone: phone || null,
          whatsappNumber,
          type: type || "CUSTOMER",
          address: address || null,
          city: city || "Dhaka",
          taxNumber: taxNumber || null,
        },
      });
      return NextResponse.json(contact, { status: 201 });
    } catch (dbError) {
      // Fallback for mock store
      const newContact = {
        id: `cnt_${Date.now()}`,
        name,
        companyName: companyName || "",
        email: email || "",
        phone: phone || "",
        whatsappNumber,
        type: type || "CUSTOMER",
        address: address || "",
        city: city || "Dhaka",
        country: "Bangladesh",
        openingBalance: 0.0,
        currentBalance: 0.0,
        createdAt: new Date().toISOString(),
      };
      mockContacts.unshift(newContact);
      return NextResponse.json(newContact, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}
