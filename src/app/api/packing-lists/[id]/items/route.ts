import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const itemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  quantity: z.number().min(1).default(1),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = itemSchema.parse(body);

    const packingListItem = await prisma.packingListItem.create({
      data: {
        ...validatedData,
        packingListId: id,
      },
      include: {
        item: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(packingListItem, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("Error adding item to packing list:", error);
    return NextResponse.json(
      { error: "Failed to add item" },
      { status: 500 }
    );
  }
}
