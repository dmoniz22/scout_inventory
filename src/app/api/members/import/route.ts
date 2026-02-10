import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parse } from "csv-parse/sync";

interface CSVRow {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const content = buffer.toString("utf-8");

    const records: CSVRow[] = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (records.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty" },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      members: [] as any[],
    };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      try {
        if (!row.name) {
          results.failed++;
          results.errors.push(`Row ${rowNum}: Missing required field 'name'`);
          continue;
        }

        // Validate role
        const validRoles = ["ADMIN", "LEADER", "MEMBER"];
        const role = row.role?.toUpperCase();
        const memberRole = validRoles.includes(role) ? role : "MEMBER";

        // Check for duplicate email
        if (row.email) {
          const existing = await prisma.member.findUnique({
            where: { email: row.email },
          });
          if (existing) {
            results.failed++;
            results.errors.push(
              `Row ${rowNum}: Email '${row.email}' already exists`
            );
            continue;
          }
        }

        const member = await prisma.member.create({
          data: {
            name: row.name,
            email: row.email || null,
            phone: row.phone || null,
            role: memberRole as any,
            isActive: true,
          },
        });

        results.success++;
        results.members.push(member);
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Row ${rowNum}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Error importing members:", error);
    return NextResponse.json(
      { error: "Failed to import members", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
