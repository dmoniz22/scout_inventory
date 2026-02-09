import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const packingListSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  campDate: z.string().optional(),
});

export async function GET() {
  try {
    const packingLists = await prisma.packingList.findMany({
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(packingLists);
  } catch (error) {
    console.error("Error fetching packing lists:", error);
    return NextResponse.json(
      { error: "Failed to fetch packing lists" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = packingListSchema.parse(body);

    const packingList = await prisma.packingList.create({
      data: {
        ...validatedData,
        campDate: validatedData.campDate ? new Date(validatedData.campDate) : null,
      },
    });

    return NextResponse.json(packingList, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("Error creating packing list:", error);
    return NextResponse.json(
      { error: "Failed to create packing list" },
      { status: 500 }
    );
  }
}
