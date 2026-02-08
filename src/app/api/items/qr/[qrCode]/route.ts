import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode } = await params;
    const item = await prisma.item.findUnique({
      where: { qrCode: qrCode },
      include: {
        category: true,
        checkouts: {
          where: { checkedInAt: null },
          include: {
            member: true,
          },
          take: 1,
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...item,
      isAvailable: item.checkouts.length === 0,
      activeCheckout: item.checkouts[0] || null,
    });
  } catch (error) {
    console.error("Error fetching item by QR:", error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}
