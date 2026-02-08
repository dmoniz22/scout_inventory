import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Soft delete by setting isActive to false
    await prisma.member.update({
      where: { id: id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Member deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating member:", error);
    return NextResponse.json(
      { error: "Failed to deactivate member" },
      { status: 500 }
    );
  }
}
