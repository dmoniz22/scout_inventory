import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const checkoutSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  memberId: z.string().min(1, "Member ID is required"),
  expectedReturn: z.string().min(1, "Expected return date is required"),
  notes: z.string().optional(),
  conditionOut: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"]),
  checkedOutBy: z.string().min(1, "Checked out by is required"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};

    if (status === "active") {
      where.checkedInAt = null;
    } else if (status === "overdue") {
      where.checkedInAt = null;
      where.expectedReturn = { lt: new Date() };
    }

    const checkouts = await prisma.checkout.findMany({
      where,
      include: {
        item: { include: { category: true } },
        member: true,
      },
      orderBy: { checkedOutAt: "desc" },
    });

    return NextResponse.json(checkouts);
  } catch (error) {
    console.error("Error fetching checkouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch checkouts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = checkoutSchema.parse(body);

    // Check if item is already checked out
    const existingCheckout = await prisma.checkout.findFirst({
      where: {
        itemId: validatedData.itemId,
        checkedInAt: null,
      },
    });

    if (existingCheckout) {
      return NextResponse.json(
        { error: "Item is already checked out" },
        { status: 400 }
      );
    }

    const checkout = await prisma.checkout.create({
      data: {
        ...validatedData,
        expectedReturn: new Date(validatedData.expectedReturn),
      },
      include: {
        item: { include: { category: true } },
        member: true,
      },
    });

    return NextResponse.json(checkout, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("Error creating checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
