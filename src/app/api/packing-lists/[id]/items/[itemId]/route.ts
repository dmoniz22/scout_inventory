import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    
    const packingListItem = await prisma.packingListItem.update({
      where: { id: itemId },
      data: body,
    });

    return NextResponse.json(packingListItem);
  } catch (error) {
    console.error("Error updating packing list item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    
    await prisma.packingListItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ message: "Item removed" });
  } catch (error) {
    console.error("Error deleting packing list item:", error);
    return NextResponse.json(
      { error: "Failed to remove item" },
      { status: 500 }
    );
  }
}
