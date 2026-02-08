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
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category");
    const search = searchParams.get("search");
    const condition = searchParams.get("condition");
    const available = searchParams.get("available");

    const where: any = { isActive: true };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { serialNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (condition) {
      where.condition = condition;
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        category: true,
        checkouts: {
          where: { checkedInAt: null },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add availability status
    const itemsWithAvailability = items.map((item) => ({
      ...item,
      isAvailable: item.checkouts.length === 0,
    }));

    // Filter by availability if requested
    let filteredItems = itemsWithAvailability;
    if (available === "true") {
      filteredItems = itemsWithAvailability.filter((item) => item.isAvailable);
    } else if (available === "false") {
      filteredItems = itemsWithAvailability.filter((item) => !item.isAvailable);
    }

    return NextResponse.json(filteredItems);
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = itemSchema.parse(body);

    const item = await prisma.item.create({
      data: {
        ...validatedData,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
