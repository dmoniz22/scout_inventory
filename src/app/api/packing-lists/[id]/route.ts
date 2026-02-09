import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const itemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  quantity: z.number().min(1, "Quantity must be at least 1").default(1),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const packingList = await prisma.packingList.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!packingList) {
      return NextResponse.json(
        { error: "Packing list not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(packingList);
  } catch (error) {
    console.error("Error fetching packing list:", error);
    return NextResponse.json(
      { error: "Failed to fetch packing list" },
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
    
    const packingList = await prisma.packingList.update({
      where: { id },
      data: body,
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    return NextResponse.json(packingList);
  } catch (error) {
    console.error("Error updating packing list:", error);
    return NextResponse.json(
      { error: "Failed to update packing list" },
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
    await prisma.packingList.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Packing list deleted" });
  } catch (error) {
    console.error("Error deleting packing list:", error);
    return NextResponse.json(
      { error: "Failed to delete packing list" },
      { status: 500 }
    );
  }
}
