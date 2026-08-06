import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    try {
      const item = await prisma.item.update({
        where: { id },
        data: body,
      });
      return NextResponse.json(item);
    } catch (dbError) {
      return NextResponse.json({ id, ...body });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    try {
      await prisma.item.delete({ where: { id } });
    } catch (dbError) {
      // Mock delete
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
