import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let mockItems = [
  {
    id: "itm_1",
    name: "Web Application Development",
    sku: "SRV-WEB-001",
    type: "SERVICE",
    description: "Custom full-stack web application development in Next.js & Tailwind",
    salesPrice: 75000.0,
    purchasePrice: 0.0,
    unit: "Project",
    stockQuantity: 0.0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "itm_2",
    name: "Dell UltraSharp 27 Monitor",
    sku: "HW-MON-027",
    type: "GOODS",
    description: "27-inch 4K UHD USB-C Hub Monitor",
    salesPrice: 42500.0,
    purchasePrice: 34000.0,
    unit: "Pcs",
    stockQuantity: 15.0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "itm_3",
    name: "SaaS Cloud Hosting Setup",
    sku: "SRV-HST-002",
    type: "SERVICE",
    description: "Managed cloud deployment, SSL, and server optimization",
    salesPrice: 15000.0,
    purchasePrice: 5000.0,
    unit: "Hours",
    stockQuantity: 0.0,
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
          { sku: { contains: search, mode: "insensitive" } },
        ];
      }

      const items = await prisma.item.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(items);
    } catch (dbError) {
      let filtered = mockItems;
      if (type && type !== "ALL") {
        filtered = filtered.filter((i) => i.type === type);
      }
      if (search) {
        filtered = filtered.filter(
          (i) =>
            i.name.toLowerCase().includes(search) ||
            (i.sku && i.sku.toLowerCase().includes(search))
        );
      }
      return NextResponse.json(filtered);
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, sku, type, description, salesPrice, purchasePrice, unit, stockQuantity } = body;

    if (!name) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    try {
      const item = await prisma.item.create({
        data: {
          name,
          sku: sku || null,
          type: type || "SERVICE",
          description: description || null,
          salesPrice: parseFloat(salesPrice) || 0.0,
          purchasePrice: parseFloat(purchasePrice) || 0.0,
          unit: unit || "Pcs",
          stockQuantity: parseFloat(stockQuantity) || 0.0,
        },
      });
      return NextResponse.json(item, { status: 201 });
    } catch (dbError) {
      const newItem = {
        id: `itm_${Date.now()}`,
        name,
        sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
        type: type || "SERVICE",
        description: description || "",
        salesPrice: parseFloat(salesPrice) || 0.0,
        purchasePrice: parseFloat(purchasePrice) || 0.0,
        unit: unit || "Pcs",
        stockQuantity: parseFloat(stockQuantity) || 0.0,
        createdAt: new Date().toISOString(),
      };
      mockItems.unshift(newItem);
      return NextResponse.json(newItem, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
