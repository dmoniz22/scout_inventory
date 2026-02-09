import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parse } from "csv-parse/sync";

interface CSVRow {
  name: string;
  description?: string;
  serialNumber?: string;
  category: string;
  condition?: string;
  notes?: string;
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

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const content = buffer.toString("utf-8");

    // Parse CSV
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
      items: [] as any[],
    };

    // Process each row
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // +2 because header is row 1

      try {
        // Validate required fields
        if (!row.name) {
          results.failed++;
          results.errors.push(`Row ${rowNum}: Missing required field 'name'`);
          continue;
        }

        if (!row.category) {
          results.failed++;
          results.errors.push(`Row ${rowNum}: Missing required field 'category'`);
          continue;
        }

        // Find or create category
        let category = await prisma.category.findFirst({
          where: { name: { equals: row.category, mode: "insensitive" } },
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: row.category,
              description: `Auto-created from CSV import`,
              color: "#3B82F6",
            },
          });
        }

        // Validate condition
        const validConditions = ["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"];
        const condition = row.condition?.toUpperCase();
        const itemCondition = validConditions.includes(condition)
          ? condition
          : "GOOD";

        // Check for duplicate serial number
        if (row.serialNumber) {
          const existing = await prisma.item.findUnique({
            where: { serialNumber: row.serialNumber },
          });
          if (existing) {
            results.failed++;
            results.errors.push(
              `Row ${rowNum}: Serial number '${row.serialNumber}' already exists`
            );
            continue;
          }
        }

        // Create item
        const item = await prisma.item.create({
          data: {
            name: row.name,
            description: row.description || null,
            serialNumber: row.serialNumber || null,
            categoryId: category.id,
            condition: itemCondition as any,
            notes: row.notes || null,
            isActive: true,
          },
          include: {
            category: true,
          },
        });

        results.success++;
        results.items.push(item);
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Row ${rowNum}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Error importing CSV:", error);
    return NextResponse.json(
      { error: "Failed to import CSV", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
