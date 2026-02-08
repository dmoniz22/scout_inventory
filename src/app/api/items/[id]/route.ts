import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"]),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.item.findUnique({
      where: { id: id },
      include: {
        category: true,
        checkouts: {
          include: {
            member: true,
          },
          orderBy: { checkedOutAt: "desc" },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check if currently checked out
    const activeCheckout = item.checkouts.find((c) => !c.checkedInAt);

    return NextResponse.json({
      ...item,
      isAvailable: !activeCheckout,
      activeCheckout,
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = itemSchema.parse(body);

    const item = await prisma.item.update({
      where: { id: id },
      data: validatedData,
      include: {
        category: true,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Soft delete by setting isActive to false
    await prisma.item.update({
      where: { id: id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
