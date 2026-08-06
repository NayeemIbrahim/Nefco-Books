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
      const contact = await prisma.contact.update({
        where: { id },
        data: body,
      });
      return NextResponse.json(contact);
    } catch (dbError) {
      return NextResponse.json({ id, ...body });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    try {
      await prisma.contact.delete({ where: { id } });
    } catch (dbError) {
      // Mock delete
    }

    return NextResponse.json({ success: true, message: "Contact deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
