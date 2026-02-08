import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const checkinSchema = z.object({
  conditionIn: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"]),
  notes: z.string().optional(),
  checkedInBy: z.string().min(1, "Checked in by is required"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = checkinSchema.parse(body);

    const checkout = await prisma.checkout.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        checkedInAt: new Date(),
      },
      include: {
        item: true,
        member: true,
      },
    });

    return NextResponse.json(checkout);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error checking in item:", error);
    return NextResponse.json(
      { error: "Failed to check in item" },
      { status: 500 }
    );
  }
}
