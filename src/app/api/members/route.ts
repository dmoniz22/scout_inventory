import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const memberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "LEADER", "MEMBER"]).default("MEMBER"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const members = await prisma.member.findMany({
      where,
      include: {
        _count: {
          select: { checkouts: { where: { checkedInAt: null } } },
        },
      },
      orderBy: { name: "asc" },
    });

    // Transform to include active checkout count
    const membersWithCount = members.map((member: typeof members[0]) => ({
      ...member,
      checkoutCount: member._count.checkouts,
    }));

    return NextResponse.json(membersWithCount);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = memberSchema.parse(body);

    const member = await prisma.member.create({
      data: {
        ...validatedData,
        isActive: true,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}
